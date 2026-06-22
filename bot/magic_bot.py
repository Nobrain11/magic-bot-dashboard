import asyncio
import aiohttp
import json
import logging
import random
import time
import os
import sys
import signal
from datetime import datetime

try:
    import base58
    from solana.rpc.async_api import AsyncClient
    from solana.rpc.commitment import Confirmed
    from solana.rpc.types import TxOpts
    from solana.rpc.core import RPCException
    from solana.keypair import Keypair
    from solana.transaction import Transaction
    from solana.publickey import PublicKey
    from solders.pubkey import Pubkey
    from spl.token.instructions import get_associated_token_address
    SOLANA_AVAILABLE = True
except ImportError:
    SOLANA_AVAILABLE = False
    print("WARNING: solana-py not installed. Running in simulation mode.", flush=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger('MagicBot')

# ==================== STRATEGY PROFILES ====================
STRATEGIES = {
    "moon": {
        "name": "Moon Protocol",
        "sell_probability": 0.20,
        "interval_seconds": 15,
        "active_buyers": 8,
        "active_sellers": 3,
        "rotate_every_n": 2,
        "buy_amounts": [0.2, 0.5, 1.0, 1.8, 2.5],
        "buy_weights": [0.20, 0.25, 0.30, 0.15, 0.10],
        "sell_portion_min": 0.03,
        "sell_portion_max": 0.10,
        "jitter_range": (0.5, 1.5),   # interval multiplier jitter
    },
    "balanced": {
        "name": "Standard",
        "sell_probability": 0.40,
        "interval_seconds": 30,
        "active_buyers": 5,
        "active_sellers": 5,
        "rotate_every_n": 3,
        "buy_amounts": [0.1, 0.2, 0.29, 0.5, 1.8],
        "buy_weights": [0.30, 0.25, 0.20, 0.15, 0.10],
        "sell_portion_min": 0.05,
        "sell_portion_max": 0.20,
        "jitter_range": (0.7, 1.3),
    },
    "stealth": {
        "name": "Ghost Protocol",
        "sell_probability": 0.50,
        "interval_seconds": 45,
        "active_buyers": 4,
        "active_sellers": 4,
        "rotate_every_n": 4,
        "buy_amounts": [0.05, 0.1, 0.15, 0.2, 0.3],
        "buy_weights": [0.25, 0.30, 0.25, 0.15, 0.05],
        "sell_portion_min": 0.05,
        "sell_portion_max": 0.15,
        "jitter_range": (0.5, 2.0),   # wider jitter for stealth
    },
}

# ==================== CONFIG ====================
class Config:
    TOKEN_MINT = "Htg5dsESFUSRdtNQ42JCgkUx5ikH6sK54nfkWFVdpump"
    WSOL_MINT = "So11111111111111111111111111111111111111112"
    JUPITER_QUOTE_API = "https://quote-api.jup.ag/v6"
    WALLETS_DIR = os.path.join(os.path.dirname(__file__), "wallets")
    TOTAL_WALLETS = 40
    TARGET_MC = 20000
    SLIPPAGE_BPS = 500
    STRATEGY = "balanced"
    RPC_URL = "https://api.mainnet-beta.solana.com"
    API_BASE = os.environ.get("API_BASE_URL", "http://localhost:8080/api")


# ==================== WALLET ROTATION ====================
class WalletRotation:
    def __init__(self, strategy: dict):
        self.strategy = strategy
        self.buyer_pool = list(range(1, 31))     # 30 potential buyers
        self.seller_pool = list(range(31, 41))   # 10 potential sellers
        random.shuffle(self.buyer_pool)
        random.shuffle(self.seller_pool)

        self.active_buyers: list[int] = []
        self.active_sellers: list[int] = []
        self.buyer_counts: dict[int, int] = {}
        self.seller_counts: dict[int, int] = {}
        self.recently_used: set[int] = set()

        self._rotate_buyers()
        self._rotate_sellers()

    def _rotate_buyers(self):
        n = self.strategy["active_buyers"]
        for wid in self.active_buyers:
            self.recently_used.add(wid)
            if wid not in self.buyer_pool:
                self.buyer_pool.append(wid)

        self.active_buyers.clear()
        available = [w for w in self.buyer_pool if w not in self.recently_used]
        if len(available) < n:
            self.recently_used.clear()
            available = self.buyer_pool.copy()

        random.shuffle(available)
        picked = available[:n]
        for wid in picked:
            self.active_buyers.append(wid)
            self.buyer_counts[wid] = 0
            if wid in self.buyer_pool:
                self.buyer_pool.remove(wid)

        logger.info(f"[ROTATE] Buyers → {self.active_buyers}")

    def _rotate_sellers(self):
        n = self.strategy["active_sellers"]
        for wid in self.active_sellers:
            if wid not in self.seller_pool:
                self.seller_pool.append(wid)

        self.active_sellers.clear()
        available = self.seller_pool.copy()
        random.shuffle(available)
        picked = available[:n]
        for wid in picked:
            self.active_sellers.append(wid)
            self.seller_counts[wid] = 0
            if wid in self.seller_pool:
                self.seller_pool.remove(wid)

        logger.info(f"[ROTATE] Sellers → {self.active_sellers}")

    def pick_buyer(self) -> int:
        rotate_at = self.strategy["rotate_every_n"]
        if all(self.buyer_counts.get(w, 0) >= rotate_at for w in self.active_buyers):
            self._rotate_buyers()

        wid = random.choice(self.active_buyers)
        self.buyer_counts[wid] = self.buyer_counts.get(wid, 0) + 1
        return wid

    def pick_seller(self) -> int:
        rotate_at = self.strategy["rotate_every_n"]
        if all(self.seller_counts.get(w, 0) >= rotate_at for w in self.active_sellers):
            self._rotate_sellers()

        wid = random.choice(self.active_sellers)
        self.seller_counts[wid] = self.seller_counts.get(wid, 0) + 1
        return wid


# ==================== MARKET DATA ====================
async def get_market_cap(session: aiohttp.ClientSession, strategy: dict) -> float:
    """Get live market cap from Jupiter quote"""
    try:
        url = f"{Config.JUPITER_QUOTE_API}/quote"
        params = {
            "inputMint": Config.WSOL_MINT,
            "outputMint": Config.TOKEN_MINT,
            "amount": int(0.1 * 1e9),
            "slippageBps": 50
        }
        async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=5)) as resp:
            if resp.status == 200:
                data = await resp.json()
                if "outAmount" in data:
                    tokens = int(data["outAmount"]) / 1e6
                    if tokens > 0:
                        # Estimate SOL price (use cached fallback)
                        sol_usd = await get_sol_price(session)
                        token_price = (0.1 / tokens) * sol_usd
                        return token_price * 1_000_000_000
    except Exception as e:
        logger.warning(f"Market cap fetch error: {e}")
    return 5000.0


async def get_sol_price(session: aiohttp.ClientSession) -> float:
    try:
        async with session.get("https://price.jup.ag/v4/price?ids=SOL",
                               timeout=aiohttp.ClientTimeout(total=4)) as resp:
            if resp.status == 200:
                data = await resp.json()
                return float(data["data"]["SOL"]["price"])
    except Exception:
        pass
    return 150.0


# ==================== JUPITER SWAP ====================
async def get_jupiter_quote(session, input_mint, output_mint, amount_lamports, slippage_bps):
    url = f"{Config.JUPITER_QUOTE_API}/quote"
    params = {
        "inputMint": input_mint,
        "outputMint": output_mint,
        "amount": amount_lamports,
        "slippageBps": slippage_bps,
    }
    async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=8)) as resp:
        if resp.status != 200:
            return None
        return await resp.json()


async def execute_swap(session, keypair, quote, wrap_sol=True):
    if not SOLANA_AVAILABLE:
        return None

    payload = {
        "quoteResponse": quote,
        "userPublicKey": str(keypair.public_key),
        "wrapAndUnwrapSol": wrap_sol,
        "dynamicComputeUnitLimit": True,
        "prioritizationFeeLamports": 100_000,
    }
    async with session.post(f"{Config.JUPITER_QUOTE_API}/swap",
                            json=payload,
                            timeout=aiohttp.ClientTimeout(total=10)) as resp:
        if resp.status != 200:
            return None
        data = await resp.json()

    tx_bytes = base58.b58decode(data["swapTransaction"])
    transaction = Transaction.deserialize(tx_bytes)
    transaction.sign(keypair)

    client = AsyncClient(Config.RPC_URL)
    try:
        opts = TxOpts(skip_preflight=False, preflight_commitment=Confirmed, max_retries=3)
        result = await client.send_transaction(transaction, keypair, opts=opts)
        return result["result"]
    except RPCException as e:
        logger.error(f"TX send error: {e}")
        return None
    finally:
        await client.close()


# ==================== BOT ACTIONS ====================
async def do_buy(session, rotation, strategy, mc, api_session):
    wid = rotation.pick_buyer()
    buy_amounts = strategy["buy_amounts"]
    buy_weights = strategy["buy_weights"]
    amount = random.choices(buy_amounts, weights=buy_weights, k=1)[0]

    logger.info(f"[BUY] Wallet W-{wid} | {amount:.3f} SOL | MC ${mc:,.0f}")

    sig = None
    if SOLANA_AVAILABLE:
        wallet_path = os.path.join(Config.WALLETS_DIR, f"wallet_{wid}.json")
        if os.path.exists(wallet_path):
            with open(wallet_path) as f:
                secret = bytes(json.load(f))
            keypair = Keypair.from_secret_key(secret)
            amount_lamports = int(amount * 1e9)
            quote = await get_jupiter_quote(session, Config.WSOL_MINT, Config.TOKEN_MINT,
                                             amount_lamports, Config.SLIPPAGE_BPS)
            if quote:
                sig = await execute_swap(session, keypair, quote)
    else:
        # Simulation
        sig = "sim_" + "".join(random.choices("abcdef0123456789", k=60))

    if sig:
        try:
            await api_session.post(f"{Config.API_BASE}/internal/transaction", json={
                "walletId": wid,
                "action": "BUY",
                "amount": amount,
                "marketCap": mc,
                "txSignature": sig,
            }, timeout=aiohttp.ClientTimeout(total=3))
        except Exception:
            pass
        logger.info(f"[BUY OK] W-{wid} | TX {sig[:16]}...")
        return True
    return False


async def do_sell(session, rotation, strategy, mc, api_session):
    wid = rotation.pick_seller()
    pct = random.uniform(strategy["sell_portion_min"], strategy["sell_portion_max"])

    logger.info(f"[SELL] Wallet W-{wid} | {pct*100:.1f}% tokens | MC ${mc:,.0f}")

    sig = None
    if SOLANA_AVAILABLE:
        wallet_path = os.path.join(Config.WALLETS_DIR, f"wallet_{wid}.json")
        if os.path.exists(wallet_path):
            with open(wallet_path) as f:
                secret = bytes(json.load(f))
            keypair = Keypair.from_secret_key(secret)
            mint_pubkey = Pubkey.from_string(Config.TOKEN_MINT)
            wallet_pubkey = Pubkey.from_string(str(keypair.public_key))
            token_account = str(get_associated_token_address(wallet_pubkey, mint_pubkey))

            client = AsyncClient(Config.RPC_URL)
            try:
                resp = await client.get_token_account_balance(Pubkey.from_string(token_account))
                token_amount = int(float(resp["result"]["value"]["amount"]))
                sell_amount = int(token_amount * pct)
                if sell_amount <= 0:
                    return False
            except Exception:
                return False
            finally:
                await client.close()

            quote = await get_jupiter_quote(session, Config.TOKEN_MINT, Config.WSOL_MINT,
                                             sell_amount, Config.SLIPPAGE_BPS)
            if quote:
                sig = await execute_swap(session, keypair, quote, wrap_sol=True)
    else:
        sig = "sim_" + "".join(random.choices("abcdef0123456789", k=60))

    if sig:
        try:
            await api_session.post(f"{Config.API_BASE}/internal/transaction", json={
                "walletId": wid,
                "action": "SELL",
                "amount": pct,
                "marketCap": mc,
                "txSignature": sig,
            }, timeout=aiohttp.ClientTimeout(total=3))
        except Exception:
            pass
        logger.info(f"[SELL OK] W-{wid} | TX {sig[:16]}...")
        return True
    return False


# ==================== MAIN LOOP ====================
async def run():
    strategy_name = os.environ.get("BOT_STRATEGY", Config.STRATEGY)
    strategy = STRATEGIES.get(strategy_name, STRATEGIES["balanced"])

    logger.info("=" * 60)
    logger.info(f"$MAGIC Bot — {strategy['name']}")
    logger.info(f"Token: {Config.TOKEN_MINT}")
    logger.info(f"Target MC: ${Config.TARGET_MC:,}")
    logger.info(f"Buy bias: {int((1-strategy['sell_probability'])*100)}%  |  Interval: {strategy['interval_seconds']}s")
    logger.info(f"Solana libs: {'available' if SOLANA_AVAILABLE else 'MISSING — simulation mode'}")
    logger.info("=" * 60)

    rotation = WalletRotation(strategy)
    cycle = 0
    running = True

    def handle_stop(signum, frame):
        nonlocal running
        logger.info("Stop signal received, shutting down...")
        running = False

    signal.signal(signal.SIGTERM, handle_stop)
    signal.signal(signal.SIGINT, handle_stop)

    connector = aiohttp.TCPConnector(limit=20)
    async with aiohttp.ClientSession(connector=connector) as session:
        async with aiohttp.ClientSession() as api_session:
            while running:
                try:
                    mc = await get_market_cap(session, strategy)
                    logger.info(f"[CYCLE {cycle}] MC: ${mc:,.0f} | Target: ${Config.TARGET_MC:,}")

                    if mc >= Config.TARGET_MC:
                        logger.info(f"TARGET REACHED: ${mc:,.0f} — bot complete.")
                        break

                    # Decide buy or sell based on strategy
                    if random.random() < strategy["sell_probability"]:
                        await do_sell(session, rotation, strategy, mc, api_session)
                    else:
                        await do_buy(session, rotation, strategy, mc, api_session)

                    cycle += 1

                    # Jitter the interval for organic appearance
                    jmin, jmax = strategy["jitter_range"]
                    sleep_time = strategy["interval_seconds"] * random.uniform(jmin, jmax)
                    logger.info(f"Sleeping {sleep_time:.1f}s...")
                    await asyncio.sleep(sleep_time)

                except asyncio.CancelledError:
                    break
                except Exception as e:
                    logger.error(f"Loop error: {e}")
                    await asyncio.sleep(strategy["interval_seconds"])

    logger.info(f"Bot finished after {cycle} cycles.")


if __name__ == "__main__":
    asyncio.run(run())

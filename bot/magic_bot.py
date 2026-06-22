import asyncio
import aiohttp
import base58
import json
import logging
import random
import time
import os
import sys
import signal
from typing import Optional, Dict, List, Set
from datetime import datetime
from dataclasses import dataclass, field

try:
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

API_BASE = os.environ.get("API_BASE_URL", "http://localhost:5000/api")

class Config:
    RPC_URL = "https://api.mainnet-beta.solana.com"
    JUPITER_QUOTE_API = "https://quote-api.jup.ag/v6"
    TOKEN_MINT = "Htg5dsESFUSRdtNQ42JCgkUx5ikH6sK54nfkWFVdpump"
    WSOL_MINT = "So11111111111111111111111111111111111111112"
    WALLETS_DIR = os.path.join(os.path.dirname(__file__), "wallets")
    TOTAL_WALLETS = 40
    ACTIVE_BUYERS = 5
    ACTIVE_SELLERS = 5
    ROTATE_EVERY_N_BUYS = 3
    TARGET_MC = 20000
    INITIAL_MC = 5000
    INTERVAL_SECONDS = 30
    BUY_AMOUNTS = [0.1, 0.2, 0.29, 0.5, 1.8]
    BUY_WEIGHTS = [0.30, 0.25, 0.20, 0.15, 0.10]
    SELL_PROBABILITY = 0.4
    SELL_PORTION_MIN = 0.05
    SELL_PORTION_MAX = 0.20
    SLIPPAGE_BPS = 500


async def post_api(session: aiohttp.ClientSession, path: str, data: dict):
    try:
        async with session.post(f"{API_BASE}{path}", json=data) as resp:
            return await resp.json()
    except Exception as e:
        logger.error(f"API post {path} error: {e}")


async def post_transaction(session: aiohttp.ClientSession, tx: dict):
    """Write transaction to the dashboard DB via API"""
    try:
        async with session.post(f"{API_BASE}/internal/transaction", json=tx) as resp:
            pass
    except Exception:
        pass


async def sync_wallet(session: aiohttp.ClientSession, wallet_data: dict):
    try:
        async with session.post(f"{API_BASE}/internal/wallet", json=wallet_data) as resp:
            pass
    except Exception:
        pass


async def simulate_cycle(session: aiohttp.ClientSession, cycle: int):
    """Simulate a bot cycle without real Solana interaction"""
    mc = Config.INITIAL_MC + cycle * random.uniform(200, 800)
    mc = min(mc, Config.TARGET_MC)

    action = "SELL" if random.random() < Config.SELL_PROBABILITY else "BUY"
    wallet_id = random.randint(1, Config.TOTAL_WALLETS)
    amount = random.choices(Config.BUY_AMOUNTS, weights=Config.BUY_WEIGHTS, k=1)[0]
    fake_sig = "sim_" + "".join(random.choices("abcdefABCDEF0123456789", k=60))

    logger.info(f"[SIM] Cycle {cycle} | MC: ${mc:,.0f} | {action} | Wallet {wallet_id} | {amount:.2f} SOL")

    try:
        async with session.post(f"{API_BASE}/internal/transaction", json={
            "walletId": wallet_id,
            "action": action,
            "amount": amount,
            "marketCap": mc,
            "txSignature": fake_sig,
        }) as resp:
            pass
    except Exception as e:
        logger.warning(f"Could not write sim tx to API: {e}")

    return mc


async def run():
    logger.info("=" * 60)
    logger.info("$MAGIC Rotating Wallet Market Maker Bot")
    logger.info(f"Token: {Config.TOKEN_MINT}")
    logger.info(f"Target MC: ${Config.TARGET_MC:,}")
    logger.info(f"Interval: {Config.INTERVAL_SECONDS}s")
    logger.info("=" * 60)

    cycle = 0
    running = True

    def handle_stop(signum, frame):
        nonlocal running
        logger.info("Received stop signal, shutting down...")
        running = False

    signal.signal(signal.SIGTERM, handle_stop)
    signal.signal(signal.SIGINT, handle_stop)

    async with aiohttp.ClientSession() as session:
        while running:
            try:
                mc = await simulate_cycle(session, cycle)
                cycle += 1

                if mc >= Config.TARGET_MC:
                    logger.info(f"TARGET MC REACHED: ${mc:,.0f}")
                    break

                await asyncio.sleep(Config.INTERVAL_SECONDS)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Loop error: {e}")
                await asyncio.sleep(Config.INTERVAL_SECONDS)

    logger.info("Bot stopped.")


if __name__ == "__main__":
    asyncio.run(run())

import { defineChain } from 'viem';
import {
    mainnet, arbitrum, optimism, polygon, base, bsc, avalanche,
    fantom, gnosis, linea, zksync, polygonZkEvm, mantle,
    scroll, celo, moonbeam, moonriver, metis, cronos, aurora,
    boba, kava, blast, mode, manta, beam,
    opBNB, ronin
} from 'viem/chains';

// Manual fallback public RPCs if default Viem ones are unreliable or rate-limited
export const CHAIN_CONFIG: Record<string, any> = {
    'ethereum': { chain: mainnet, rpc: 'https://rpc.flashbots.net' },
    'arbitrum': { chain: arbitrum, rpc: 'https://arb1.arbitrum.io/rpc' },
    'optimism': { chain: optimism, rpc: 'https://mainnet.optimism.io' },
    'polygon': { chain: polygon, rpc: 'https://polygon-rpc.com' },
    'base': { chain: base, rpc: 'https://mainnet.base.org' },
    'bsc': { chain: bsc, rpc: 'https://bsc-dataseed.binance.org' },
    'avalanche': { chain: avalanche, rpc: 'https://api.avax.network/ext/bc/C/rpc' },
    'fantom': { chain: fantom, rpc: 'https://rpc.ftm.tools' },
    'gnosis': { chain: gnosis, rpc: 'https://rpc.gnosischain.com' },
    'linea': { chain: linea, rpc: 'https://rpc.linea.build' },
    'zksync': { chain: zksync, rpc: 'https://mainnet.era.zksync.io' },
    'polygon-zkevm': { chain: polygonZkEvm, rpc: 'https://zkevm-rpc.com' },
    'mantle': { chain: mantle, rpc: 'https://rpc.mantle.xyz' },
    'scroll': { chain: scroll, rpc: 'https://rpc.scroll.io' },
    'celo': { chain: celo, rpc: 'https://forno.celo.org' },
    'moonbeam': { chain: moonbeam, rpc: 'https://rpc.api.moonbeam.network' },
    'moonriver': { chain: moonriver, rpc: 'https://rpc.api.moonriver.moonbeam.network' },
    'metis': { chain: metis, rpc: 'https://andromeda.metis.io/?owner=1088' },
    'cronos': { chain: cronos, rpc: 'https://evm.cronos.org' },
    'aurora': { chain: aurora, rpc: 'https://mainnet.aurora.dev' },
    'boba': { chain: boba, rpc: 'https://mainnet.boba.network' },
    'kava': { chain: kava, rpc: 'https://evm.kava.io' },
    'blast': { chain: blast, rpc: 'https://rpc.blast.io' },
    'mode': { chain: mode, rpc: 'https://1rpc.io/mode' },
    'manta': { chain: manta, rpc: 'https://pacific-rpc.manta.network/http' },
    'beam': { chain: beam, rpc: 'https://build.onbeam.com/rpc' },
    'opbnb': { chain: opBNB, rpc: 'https://opbnb-mainnet-rpc.bnbchain.org' },
    'ronin': { chain: ronin, rpc: 'https://api.roninchain.com/rpc' }
};

export const SUPPORTED_CHAINS = Object.keys(CHAIN_CONFIG);

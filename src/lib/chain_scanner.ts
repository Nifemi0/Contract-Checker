import { createPublicClient, http, Address } from 'viem';
import { CHAIN_CONFIG } from './chains_config';

export class ChainScanner {
    private clients: Record<string, any> = {};

    constructor() {
        // Initialize lightweight clients for all chains
        for (const [key, config] of Object.entries(CHAIN_CONFIG)) {
            this.clients[key] = createPublicClient({
                chain: config.chain,
                transport: http(config.rpc, { batch: true }) // Enable batching
            });
        }
    }

    async detectChain(address: string): Promise<string> {
        console.log(`[Scanner] Checking ${Object.keys(this.clients).length} chains for ${address}...`);

        // Sequential scan to be gentle on public RPCs
        const chainKeys = Object.keys(this.clients);

        for (const key of chainKeys) {
            try {
                const client = this.clients[key];
                const code = await client.getBytecode({ address: address as Address });
                if (code && code !== '0x') {
                    return key;
                }
            } catch (e) {
                // Silent fail on individual chain error to keep moving
                // console.warn(`[Scanner] Failed checking ${key}`);
            }
        }

        return 'unknown';
    }

    getClient(chainName: string) {
        return this.clients[chainName] || this.clients['ethereum'];
    }
}

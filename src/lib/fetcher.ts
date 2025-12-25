import { createPublicClient, http, Address, Hex } from 'viem';
import { mainnet } from 'viem/chains';
import { z } from 'zod';

// Simple Fetcher Result Schema
export const FetchResultSchema = z.object({
    bytecode: z.string(),
    bytecodeHash: z.string(),
    isVerified: z.boolean(),
    abi: z.array(z.any()).optional(), // We'll leverage Viem's ABI types later, keeping it loose for now
});

export type FetchResult = z.infer<typeof FetchResultSchema>;

export class ContractFetcher {
    private client;

    constructor(rpcUrl?: string, customClient?: any) {
        if (customClient) {
            this.client = customClient;
        } else {
            this.client = createPublicClient({
                chain: mainnet,
                transport: http(rpcUrl)
            });
        }
    }

    public setClient(client: any) {
        this.client = client;
    }

    async fetchContractData(address: string): Promise<FetchResult> {
        if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
            throw new Error(`Invalid address format: ${address}`);
        }

        const bytecode = await this.client.getBytecode({
            address: address as Address
        });

        if (!bytecode) {
            throw new Error(`No bytecode found at ${address}. Is this an EOA?`);
        }

        // Hash the bytecode for identity checks (e.g. comparing generic proxies)
        const bytecodeHash = await this.keccak256(bytecode);

        // TODO: Integration with Etherscan/Sourcify for ABI verification
        // For MVP phase 1, we assume unverified/no-ABI or manual ABI injection
        const isVerified = false;

        return {
            bytecode,
            bytecodeHash,
            isVerified,
            abi: undefined,
        };
    }

    private async keccak256(data: Hex): Promise<string> {
        const { keccak256 } = await import('viem');
        return keccak256(data);
    }
}

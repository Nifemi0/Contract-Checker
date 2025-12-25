import { RiskSchema } from '../types/schema';
import { z } from 'zod';

export class RiskFetcher {
    private knownHacks: Record<string, string>;

    constructor() {
        // MVP: Hardcoded list of famous hacks
        this.knownHacks = {
            '0xb5d85cbf7cb3ee0d56b3bb207d5fc4b82f43f511': 'Euler Finance (Flash Loan Exploit)',
            '0x2b6ed29a95753c3ad948348e3e7b1a251080ffb9': 'Nomad Bridge (Root Exploit)',
            '0x8894e0a0c962cb723c1976a4421c95949be2d4e3': 'Ronin Bridge (Key Compromise)',
            // WETH (Safe check)
            '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'Safe (WETH)'
        };
    }

    check(address: string): z.infer<typeof RiskSchema> | null {
        const lowerAddr = address.toLowerCase();

        if (this.knownHacks[lowerAddr] && this.knownHacks[lowerAddr] !== 'Safe (WETH)') {
            return {
                id: 'legacy_exploit',
                category: 'dependency', // or 'security-incident'
                description: `This contract is linked to a known exploit: ${this.knownHacks[lowerAddr]}`,
                affectedActors: ['user_any'],
                severity: 'high',
                triggerCondition: 'Historical Event'
            };
        }

        return null;
    }
}

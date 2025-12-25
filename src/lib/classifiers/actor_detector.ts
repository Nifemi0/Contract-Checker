import { ActorTypeSchema, ActorSchema } from '../../types/schema';
import { z } from 'zod';

type Actor = z.infer<typeof ActorSchema>;

// Simple heuristics for now. 
// In a real implementation, this would check storage slots (e.g. owner slot) or function return values.
export class ActorDetector {

    detect(address: string, knownRoles: Record<string, string>): Actor {
        // 1. Check if it's a known special address (e.g. Zero Address)
        if (address === '0x0000000000000000000000000000000000000000') {
            return {
                id: 'burn_address',
                type: 'user', // Technically a user context, or a 'black hole'
                address,
                description: 'The zero address (burn destination)'
            };
        }

        // 2. Check inferred role from input map (e.g. from an 'owner()' call result)
        if (knownRoles[address]) {
            return {
                id: `${knownRoles[address]}_${address.slice(0, 6)}`,
                type: 'admin', // Bias towards admin if it was fetched from a privileged getter
                address,
                description: `Detected ${knownRoles[address]}`
            };
        }

        // 3. Default to User
        return {
            id: `user_${address.slice(0, 6)}`,
            type: 'user',
            address,
            description: 'Unknown actor'
        };
    }

    // Merge multiple actors and deduplicate
    deduplicate(actors: Actor[]): Actor[] {
        const seen = new Set();
        return actors.filter(a => {
            if (seen.has(a.address)) return false;
            seen.add(a.address);
            return true;
        });
    }
}

import { ControlsSchema } from '../../types/schema';
import { z } from 'zod';

type Controls = z.infer<typeof ControlsSchema>;

export class ControlMap {

    detect(bytecode: string, functionSelectors: string[]): Controls {
        // Signatures
        const sigs = {
            transferOwnership: '0xf2fde38b',
            renounceOwnership: '0x715018a6',
            upgradeTo: '0x3659cfe6',
            grantRole: '0x2f2ff15d',
            revokeRole: '0xd547741f',
            pause: '0x8456cb59',
            unpause: '0x3f4ba83a'
        };

        const permissions: z.infer<typeof ControlsSchema>['permissions'] = [];
        let upgradePattern: z.infer<typeof ControlsSchema>['upgradeability']['pattern'] = 'none';

        // 1. Detect Proxy Patterns (Advanced)
        const proxyPattern = this.detectProxyPattern(bytecode, functionSelectors);
        upgradePattern = proxyPattern;

        // 1b. Detect Delegatecall (Security Risk)
        const hasDelegatecall = this.detectDelegatecall(bytecode);
        if (hasDelegatecall) {
            permissions.push({
                capability: 'delegatecall',
                actorId: 'admin',
                scope: 'global',
                revocable: false
            });
        }

        // 2. Detect Permissions (Ownable)
        if (functionSelectors.includes(sigs.transferOwnership)) {
            permissions.push({
                actorId: 'owner_unknown', // Placeholder until we can actually fetch the owner
                capability: 'upgrade', // If upgradeable, owner usually controls it
                revocable: true, // RenounceOwnership exists
                scope: 'global'
            });
        }

        // 2. Map Permissions (Caps)
        if (functionSelectors.includes('0x8456cb59')) { // pause()
            permissions.push({
                capability: 'pause',
                actorId: 'admin',
                scope: 'global',
                revocable: true
            });
        }

        if (functionSelectors.includes('0xf9f92be4') || functionSelectors.includes('0x347c4846')) { // blacklist
            permissions.push({
                capability: 'blacklist',
                actorId: 'admin',
                scope: 'global',
                revocable: true // Usually can un-blacklist
            });
        }

        if (functionSelectors.includes('0x095ea7b3')) { // approve - standard
            // We don't list approve as a "permission" of the admin usually, it's a user capability.
            // Leaving emptiness here, just conceptual check.
        }

        // 3. Detect Pausability
        if (functionSelectors.includes(sigs.pause)) {
            permissions.push({
                actorId: 'pauser_unknown',
                capability: 'pause',
                revocable: false, // AccessControl revocation is complex, assuming false for MVP
                scope: 'global'
            });
        }

        return {
            permissions,
            upgradeability: {
                pattern: upgradePattern,
                upgradeAuthority: upgradePattern !== 'none' ? 'owner_unknown' : null,
                timelockSeconds: null, // Hard to detect without decoding storage/constructor
                upgradeHistoryCount: 0
            }
        };
    }

    private detectProxyPattern(
        bytecode: string,
        functionSelectors: string[]
    ): 'none' | 'transparent-proxy' | 'uups' | 'beacon' | 'diamond' | 'minimal-proxy' {

        // Check UUPS (EIP-1822)
        // proxiableUUID() - 0x52d1902d
        if (functionSelectors.includes('0x52d1902d')) {
            return 'uups';
        }

        // Check Beacon Proxy
        // implementation() - 0x5c60da1b
        if (functionSelectors.includes('0x5c60da1b')) {
            return 'beacon';
        }

        // Check Diamond (EIP-2535)
        // facets() - 0x7a0ed627
        // facetAddress(bytes4) - 0xcdffacc6
        if (functionSelectors.includes('0x7a0ed627') || functionSelectors.includes('0xcdffacc6')) {
            return 'diamond';
        }

        // Check Minimal Proxy (EIP-1167)
        // Bytecode pattern: 363d3d373d3d3d363d73[address]5af43d82803e903d91602b57fd5bf3
        if (bytecode.includes('363d3d373d3d3d363d73') && bytecode.includes('5af43d82803e903d91602b57fd5bf3')) {
            return 'minimal-proxy';
        }

        // Check Transparent Proxy (existing)
        // upgradeTo(address) - 0x3659cfe6
        if (functionSelectors.includes('0x3659cfe6')) {
            return 'transparent-proxy';
        }

        return 'none';
    }

    private detectDelegatecall(bytecode: string): boolean {
        // Disabled for MVP - simple pattern matching has too many false positives
        // Requires proper EVM disassembly to distinguish opcodes from data
        return false;
    }
}

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

        // 1b. Detect Delegatecall (Security Risk) - Only flag if NOT a proxy
        // Proxies legitimately use delegatecall, so we only flag it as suspicious in non-proxy contracts
        const hasDelegatecall = this.detectDelegatecall(bytecode);
        if (hasDelegatecall && proxyPattern === 'none') {
            // Delegatecall in a non-proxy contract is a security risk
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
                upgradeHistoryCount: 0,
                adminPattern: this.detectAdminPattern(functionSelectors)
            }
        };
    }

    private detectAdminPattern(functionSelectors: string[]): 'ownable' | 'access-control' | 'multisig' | 'timelock' | 'custom' | 'none' {
        // AccessControl (OpenZeppelin) - hasRole, getRoleAdmin
        if (functionSelectors.includes('0x91d14854') || functionSelectors.includes('0x248a9ca3')) {
            return 'access-control';
        }

        // MultiSig (Gnosis Safe) - getOwners, getThreshold
        if (functionSelectors.includes('0xa0e67e2b') && functionSelectors.includes('0xe75235b8')) {
            return 'multisig';
        }

        // Timelock (Compound) - delay, queuedTransactions
        if (functionSelectors.includes('0x6a42b8f8') || functionSelectors.includes('0xf2b06537')) {
            return 'timelock';
        }

        // Governance-controlled (DAI/Maker style: rely/deny)
        // rely(address) - 0x65fae35e, deny(address) - 0x9c52a7f1
        if (functionSelectors.includes('0x65fae35e') && functionSelectors.includes('0x9c52a7f1')) {
            return 'custom'; // Or maybe 'governance' if we add it to the enum
        }

        // Standard Ownable - owner()
        // OR Proxy Admin - admin() (0x4f1ef286) 
        if (functionSelectors.includes('0x8da5cb5b') || functionSelectors.includes('0x4f1ef286')) {
            return 'ownable';
        }

        return 'none';
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
        // DELEGATECALL opcode is 0xF4
        // Improved heuristic: look for f4 in likely opcode positions
        // This is still not perfect but reduces false positives significantly

        const code = bytecode.toLowerCase();

        // Pattern 1: f4 followed by common stack operations
        // DELEGATECALL is often followed by ISZERO (15), PUSH (60-7f), or DUP (80-8f)
        const delegatecallPatterns = [
            'f415', // DELEGATECALL + ISZERO
            'f460', 'f461', 'f462', // DELEGATECALL + PUSH
            'f480', 'f481', 'f482', // DELEGATECALL + DUP
        ];

        for (const pattern of delegatecallPatterns) {
            if (code.includes(pattern)) {
                return true;
            }
        }

        return false;
    }
}

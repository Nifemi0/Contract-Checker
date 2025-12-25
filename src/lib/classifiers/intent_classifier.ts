import { IntentSchema } from '../../types/schema';
import { z } from 'zod';

type Intent = z.infer<typeof IntentSchema>;

export class IntentClassifier {

    classify(bytecode: string, functionSelectors: string[]): Intent {
        const tags: z.infer<typeof IntentSchema>['behaviorTags'] = [];
        let summary = "Unknown contract behavior.";

        // Basic Heuristics based on Function Selectors (4 bytes)
        // ERC20: transfer(address,uint256) -> a9059cbb
        // ERC721: safeTransferFrom(...) -> 42842e0e
        // Ownable: owner() -> 8da5cb5b

        const sigs = {
            transfer: '0xa9059cbb',
            transferFrom: '0x23b872dd',
            approve: '0x095ea7b3',
            owner: '0x8da5cb5b',
            upgradeTo: '0x3659cfe6',
            deposit: '0xd0e30db0', // WETH deposit
            withdraw: '0x2e1a7d4d',  // WETH withdraw
            pause: '0x8456cb59',    // pause()
            unpause: '0x3f4ba83a',  // unpause()
            blacklist: '0xf9f92be4', // addToBlacklist() (USDC/USDT variant)
            blackList: '0x347c4846'  // addBlackList (Tether variant)
        };

        const hasTransfer = functionSelectors.includes(sigs.transfer);
        const hasOwner = functionSelectors.includes(sigs.owner);
        const hasUpgrade = functionSelectors.includes(sigs.upgradeTo);
        const hasDeposit = functionSelectors.includes(sigs.deposit);
        const hasWithdraw = functionSelectors.includes(sigs.withdraw);
        const hasBlacklist = functionSelectors.includes(sigs.blacklist) || functionSelectors.includes(sigs.blackList);
        const hasPause = functionSelectors.includes(sigs.pause) || functionSelectors.includes(sigs.unpause);

        // Classification Hierarchy
        // 1. Asset Wrapper (WETH pattern: deposit + withdraw + transfer, usually no owner/strategy)
        if (hasDeposit && hasWithdraw && hasTransfer) {
            tags.push('asset-wrapping');
            summary = "Wrap native ETH into an ERC20-compatible token and allow deterministic 1:1 conversion.";
        }
        // 2. Proxy / Upgradeability (USDC, etc) - CHECK FIRST as it overrides others often
        else if (hasUpgrade) {
            tags.push('upgradeable');
            tags.push('proxy');
            summary = "Upgradeable Proxy Contract (Logic is delegated).";
        }
        // 3. Centralized Token
        else if (hasTransfer && (hasBlacklist || hasPause)) {
            tags.push('custody');

            summary = "Centralized Token with administrative controls (Pause/Blacklist).";
        }
        // 3. Generic Token/Vault
        else if (hasTransfer) {
            tags.push('custody');
            summary = "Token or Vault contract handling asset transfers.";
        }

        const daiSigs = {
            rely: '0x65fae35e',
            deny: '0x9c52a7f1'
        };
        if (functionSelectors.includes(daiSigs.rely) && functionSelectors.includes(daiSigs.deny)) {
            tags.push('governance-controlled');
        } else if (hasOwner) {
            tags.push('governance-controlled');
        }

        if (hasOwner) {
            tags.push('governance-controlled');
        }

        const mintBurnSigs = {
            mint: '0x40c10f19',
            burn: '0x42966c68'
        };
        if (functionSelectors.includes(mintBurnSigs.mint) || functionSelectors.includes(mintBurnSigs.burn)) {
            tags.push('mint-burn');
        }

        if (hasUpgrade) {
            tags.push('upgradeable');
            summary += " Logic can be upgraded by an admin.";
        } else if (tags.includes('asset-wrapping')) {
            tags.push('non-upgradeable'); // Explicitly mentioned by user as important
        }

        if (tags.length === 0) {
            summary = "Contract with opaque logic.";
        }

        return {
            summary,
            behaviorTags: tags
        };
    }
}

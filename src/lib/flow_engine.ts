import { ValueFlowSchema } from '../types/schema';
import { z } from 'zod';

type ValueFlow = z.infer<typeof ValueFlowSchema>;

export class FlowEngine {

    analyze(bytecode: string, functionSelectors: string[]): ValueFlow[] {
        const flows: ValueFlow[] = [];

        // Signatures
        const sigs = {
            withdraw: '0x2e1a7d4d', // withdraw(uint256) (WETH standard)
            deposit: '0xd0e30db0',  // deposit() common wrapped ether
            approve: '0x095ea7b3',
            transferFrom: '0x23b872dd',
            mint: '0x40c10f19'
        };

        // 1. Detect User Deposits (Inflow) -> Wrapper Logic
        if (functionSelectors.includes(sigs.deposit)) {
            flows.push({
                id: 'deposit_flow',
                sourceActorId: 'user_any',
                targetActorId: 'contract',
                asset: 'ETH', // More specific
                trigger: 'user-action',
                conditions: "payable deposit()",
                frequency: 'on-demand'
            });
            // Reciprocal Mint Flow (The user asked for this detail)
            flows.push({
                id: 'deposit_mint_flow',
                sourceActorId: 'contract',
                targetActorId: 'user_any',
                asset: 'WETH (ERC20)',
                trigger: 'automatic',
                conditions: "exact 1:1 mint on ETH received",
                frequency: 'immediate'
            });
        }

        // 2. Detect Withdrawals (Outflow) -> Wrapper Logic
        if (functionSelectors.includes(sigs.withdraw)) {
            flows.push({
                id: 'withdraw_flow',
                sourceActorId: 'user_any',
                targetActorId: 'contract',
                asset: 'WETH',
                trigger: 'user-action',
                conditions: "withdraw(amount)",
                frequency: 'on-demand'
            });
            // Reciprocal Burn/Release Flow
            flows.push({
                id: 'withdraw_release_flow',
                sourceActorId: 'contract',
                targetActorId: 'user_any',
                asset: 'ETH',
                trigger: 'automatic',
                conditions: "exact 1:1 burn of WETH",
                frequency: 'immediate'
            });
        }

        // 3. Detect Admin Minting (Inflation Risk)
        if (functionSelectors.includes(sigs.mint)) {
            flows.push({
                id: 'admin_mint',
                sourceActorId: 'contract', // Minting creates from nothing (or contract) to target
                targetActorId: 'user_any', // or specific admin
                asset: 'ERC20',
                trigger: 'admin-action', // usually protected
                conditions: "Caller must be minter",
                frequency: 'on-demand'
            });
        }

        // 4. Baseline ERC20 Flows (Standard Transfer)
        // If it has transferFrom or transfer, users can move value
        if (functionSelectors.includes(sigs.transferFrom)) {
            flows.push({
                id: 'user_transfer',
                sourceActorId: 'user_any',
                targetActorId: 'user_any', // User to User
                asset: 'ERC20',
                trigger: 'user-action',
                conditions: "transfer(to, amount)",
                frequency: 'on-demand'
            });
        }

        // 5. Admin Confiscation (USDT/USDC)
        const blacklistSig = '0xf9f92be4'; // addToBlacklist
        const tetherBlacklist = '0x347c4846'; // addBlackList
        if (functionSelectors.includes(blacklistSig) || functionSelectors.includes(tetherBlacklist)) {
            flows.push({
                id: 'admin_seize',
                sourceActorId: 'contract', // Admin/Contract acts on User
                targetActorId: 'user_any',
                asset: 'Freeze/Seize', // Abstract Asset
                trigger: 'admin-action',
                conditions: "admin calls blacklist()",
                frequency: 'event-driven'
            });
        }

        // Pause is a CONTROL state, not a VALUE flow. Removed per user feedback.
        return flows;
    }
}

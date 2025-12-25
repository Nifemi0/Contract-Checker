import { BehaviorAnalysisSchema } from '../../types/schema';
import { z } from 'zod';

type BehaviorAnalysis = z.infer<typeof BehaviorAnalysisSchema>;

export class BehaviorClassifier {
    analyze(bytecode: string, functionSelectors: string[]): BehaviorAnalysis {
        const riskFlags: string[] = [];
        let incentiveModel: BehaviorAnalysis['incentiveModel'] = 'standard';

        // 1. Detect Rebasing (stETH, aToken style)
        // sharesOf(address) - 0xf028880c
        // getRate() - 0x679d9435
        if (functionSelectors.includes('0xf028880c') || functionSelectors.includes('0x679d9435')) {
            incentiveModel = 'rebasing';
            riskFlags.push('rebasing-token');
        }

        // 2. Detect Fee-on-Transfer
        // getFee() - 0xb800589d
        // taxRate() - 0x1922c0d5
        if (functionSelectors.includes('0xb800589d') || functionSelectors.includes('0x1922c0d5')) {
            incentiveModel = 'fee-on-transfer';
            riskFlags.push('fee-on-transfer');
        }

        // 3. Detect Reflection (SafeMoon style)
        // reflect(uint256) - 0x36b000ea
        if (functionSelectors.includes('0x36b000ea')) {
            incentiveModel = 'reflection';
            riskFlags.push('reflection-token');
        }

        return {
            incentiveModel,
            riskFlags,
            beneficiaries: []
        };
    }
}

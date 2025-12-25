import { ContractExplanationSchema, ContractExplanation } from '../src/types/schema';

// Mock Data: A simple Staking Contract
const mockData: any = { // Using any to bypass TS for raw JSON simulation
    meta: {
        address: "0x1234567890123456789012345678901234567890",
        chain: "ethereum",
        contractType: "vault",
        verifiedSource: true,
        analysisTimestamp: Date.now(),
    },
    intent: {
        summary: "This contract accepts ETH deposits and allows the admin to withdraw them.",
        behaviorTags: ["custody", "fee-extraction"], // Correct tags
    },
    actors: [
        { id: "admin_1", type: "admin", address: "0xAdmin...", description: "Protocol Deployer" },
        { id: "user_any", type: "user", address: "0x000...", description: "Any depositor" }
    ],
    controls: {
        permissions: [
            { actorId: "admin_1", capability: "seize", revocable: false }
        ],
        upgradeability: {
            pattern: "none",
            upgradeAuthority: null,
            timelockSeconds: null,
            upgradeHistoryCount: 0
        }
    },
    valueFlows: [
        {
            id: "flow_1",
            sourceActorId: "user_any",
            targetActorId: "contract", // Note: 'contract' isn't in actors list above, validation should arguably catch this if I added a refinement, but basic schema passes.
            asset: "ETH",
            trigger: "user-action",
            conditions: "None",
            frequency: "on-demand"
        }
    ],
    risks: [
        {
            id: "risk_1",
            category: "admin-abuse",
            description: "Admin can seize all funds",
            affectedActors: ["user_any"],
            severity: "high",
            triggerCondition: "Admin calls emergencyWithdraw()"
        }
    ],
    beneficiaries: [
        { actorId: "admin_1", benefitType: "control", conditions: "always", timeHorizon: "long-term" }
    ],
    confidence: {
        score: 0.95,
        limitations: []
    }
};

try {
    const result = ContractExplanationSchema.parse(mockData);
    console.log("✅ Validation SUCCESS");
    // console.log(JSON.stringify(result, null, 2));
} catch (e: any) {
    console.error("❌ Validation FAILED");
    console.error(e.errors);
    process.exit(1);
}

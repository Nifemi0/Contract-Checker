import { z } from 'zod';

// -------------------------------------------------------------------------
// 2. Meta
// -------------------------------------------------------------------------
export const MetaSchema = z.object({
    address: z.string(),
    chain: z.string(),
    contractType: z.enum(['token', 'vault', 'governance', 'proxy', 'router', 'unknown']),
    verifiedSource: z.boolean(),
    bytecodeHash: z.string().optional(),
    analysisTimestamp: z.number(),
});

// -------------------------------------------------------------------------
// 3. Intent
// -------------------------------------------------------------------------
export const IntentSchema = z.object({
    summary: z.string().describe("One sentence. Deterministic."),
    behaviorTags: z.array(z.enum([
        'custody',
        'asset-wrapping', // NEW
        'fee-extraction',
        'upgradeable',
        'non-upgradeable', // NEW
        'governance-controlled',
        'mint-burn',
        'proxy', // NEW
        'external-dependency'
    ])).describe("Controlled vocabulary."),
});


export const ActorTypeSchema = z.union([
    z.literal('user'),
    z.literal('admin'),
    z.literal('multisig'),
    z.literal('dao'),
    z.literal('contract'), // Added "contract" (Self)
    z.literal('external-contract'),
    z.literal('oracle')
]);

export const ActorSchema = z.object({
    id: z.string(),
    type: ActorTypeSchema,
    address: z.string(),
    description: z.string(),
});

// -------------------------------------------------------------------------
// 5. Controls
// -------------------------------------------------------------------------
export const PermissionSchema = z.object({
    actorId: z.string(),
    capability: z.enum(['pause', 'upgrade', 'set-fees', 'mint', 'seize', 'redirect', 'blacklist', 'delegatecall']),
    scope: z.string().optional(),
    revocable: z.boolean(),
});

export const UpgradeabilitySchema = z.object({
    pattern: z.enum(['none', 'transparent-proxy', 'uups', 'beacon', 'diamond', 'minimal-proxy']),
    upgradeAuthority: z.string().nullable().describe("Actor ID of who can upgrade"),
    timelockSeconds: z.number().nullable(),
    upgradeHistoryCount: z.number(),
});

export const ControlsSchema = z.object({
    permissions: z.array(PermissionSchema),
    upgradeability: UpgradeabilitySchema,
});

// -------------------------------------------------------------------------
// 6. Value Flows
// -------------------------------------------------------------------------
export const ValueFlowSchema = z.object({
    id: z.string(),
    sourceActorId: z.string(),
    targetActorId: z.string(),
    asset: z.string(),
    trigger: z.enum(['user-action', 'admin-action', 'automatic', 'external']),
    conditions: z.string().describe("Plain constraints, not code."),
    frequency: z.enum(['on-demand', 'per-block', 'event-driven', 'immediate']),
});

// -------------------------------------------------------------------------
// 7. Risks
// -------------------------------------------------------------------------
export const RiskSchema = z.object({
    id: z.string(),
    category: z.enum(['admin-abuse', 'incentive-misalignment', 'dependency', 'governance-capture']),
    description: z.string(),
    affectedActors: z.array(z.string()), // Actor IDs
    severity: z.enum(['low', 'medium', 'high']),
    triggerCondition: z.string(),
});

// -------------------------------------------------------------------------
// 8. Beneficiaries
// -------------------------------------------------------------------------
export const BeneficiarySchema = z.object({
    actorId: z.string(),
    benefitType: z.enum(['fees', 'token-appreciation', 'control', 'optionality']),
    conditions: z.string(),
    timeHorizon: z.enum(['immediate', 'long-term']),
});

// -------------------------------------------------------------------------
// 9. Confidence
// -------------------------------------------------------------------------
export const ConfidenceSchema = z.object({
    score: z.number().min(0).max(1),
    limitations: z.array(z.string()),
});

// -------------------------------------------------------------------------
// 1. Root Object: ContractExplanation
// -------------------------------------------------------------------------
export const ContractExplanationSchema = z.object({
    meta: MetaSchema,
    intent: IntentSchema,
    actors: z.array(ActorSchema),
    controls: ControlsSchema,
    valueFlows: z.array(ValueFlowSchema),
    risks: z.array(RiskSchema),
    beneficiaries: z.array(BeneficiarySchema),
    confidence: ConfidenceSchema,
});

export type ContractExplanation = z.infer<typeof ContractExplanationSchema>;

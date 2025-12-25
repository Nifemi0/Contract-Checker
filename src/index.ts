import { ContractFetcher } from './lib/fetcher';
import { IntentClassifier } from './lib/classifiers/intent_classifier';
import { ActorDetector } from './lib/classifiers/actor_detector';
import { ControlMap } from './lib/classifiers/control_map';
import { FlowEngine } from './lib/flow_engine';
import { ChainScanner } from './lib/chain_scanner';
import { RiskFetcher } from './lib/risk_fetcher';
import { ContractExplanation, ContractExplanationSchema } from './types/schema';
import * as dotenv from 'dotenv';

dotenv.config();

export class ContractCheckerEngine {
    private fetcher: ContractFetcher;
    private intentClassifier: IntentClassifier;
    private actorDetector: ActorDetector;
    private controlMap: ControlMap;
    private flowEngine: FlowEngine;
    private chainScanner: ChainScanner;
    private riskFetcher: RiskFetcher;

    constructor(rpcUrl?: string) {
        this.fetcher = new ContractFetcher(rpcUrl);
        this.intentClassifier = new IntentClassifier();
        this.actorDetector = new ActorDetector();
        this.controlMap = new ControlMap();
        this.flowEngine = new FlowEngine();
        this.chainScanner = new ChainScanner();
        this.riskFetcher = new RiskFetcher();
    }

    async analyze(address: string): Promise<ContractExplanation> {
        console.log(`[Engine] Analyzing ${address}...`);

        // 1. Auto-Detect Chain
        let detectedChain = 'unknown';
        try {
            detectedChain = await this.chainScanner.detectChain(address);
        } catch (e) {
            console.warn("[Engine] Chain detection failed, defaulting to ethereum/unknown");
        }
        console.log(`[Engine] Detected Chain: ${detectedChain}`);

        // 2. Fetch Data
        // NOTE: In a robust version, we would verify the contract actually exists on the detected chain's RPC.
        // For MVP, we use the default fetcher (mainnet) but rely on the scanner's result for metadata.
        // If it's pure L2, fetcher might fail if it's strictly mainnet bound.
        // Ideally we pass the chain client to the fetcher, but let's keep it simple.
        let data;
        try {
            // Use the client for the detected chain (or default Mainnet if unknown)
            const activeClient = this.chainScanner.getClient(detectedChain === 'unknown' ? 'ethereum' : detectedChain);
            this.fetcher.setClient(activeClient);

            data = await this.fetcher.fetchContractData(address);
        } catch (e) {
            console.warn(`[Engine] Fetch failed on ${detectedChain}:`, e);
            throw e;
        }

        const functionSelectors = this.extractSelectors(data.bytecode);

        // 3. Classify Behavior
        const intent = this.intentClassifier.classify(data.bytecode, functionSelectors);
        const controls = this.controlMap.detect(data.bytecode, functionSelectors);

        // 4. Detect Actors
        // 4. Detect Actors (Refined)
        const actors = [];

        // A. The Contract Itself
        actors.push({
            id: 'contract',
            type: 'contract' as const,
            address: address,
            description: 'The automated logic and custody enforcement'
        });

        // B. Generic User (if public flows exist)
        if (intent.behaviorTags.includes('custody') || intent.behaviorTags.includes('asset-wrapping')) {
            actors.push({
                id: 'user_any',
                type: 'user' as const,
                address: 'Any Public Address',
                description: 'Holders who can transfer or interact with the asset'
            });
        }

        // C. Admin (if controls exist)
        const hasAdminPower = controls.upgradeability.pattern !== 'none' || controls.permissions.length > 0;
        if (hasAdminPower || intent.summary.includes('Centralized')) {
            actors.push({
                id: 'admin',
                type: 'admin' as const,
                address: 'Owner / MultiSig',
                description: 'Can pause transfers, blacklist, or upgrade logic'
            });
        }

        // 5. Map Flows
        const flows = this.flowEngine.analyze(data.bytecode, functionSelectors);

        // 6. Check Historical Risk
        const historicalRisk = this.riskFetcher.check(address);
        const risks = [];
        if (historicalRisk) risks.push(historicalRisk);

        // 7. Build Result
        const result: ContractExplanation = {
            meta: {
                address,
                chain: detectedChain,
                contractType: 'unknown',
                verifiedSource: data.isVerified,
                bytecodeHash: data.bytecodeHash,
                analysisTimestamp: Date.now()
            },
            intent,
            actors,
            controls,
            valueFlows: flows,
            risks,
            beneficiaries: [],
            confidence: {
                score: historicalRisk ? 0.1 : 0.5,
                limitations: ['Static analysis only', 'No storage inspection']
            }
        };

        return ContractExplanationSchema.parse(result);
    }

    private extractSelectors(bytecode: string): string[] {
        const matches = bytecode.match(/63([0-9a-f]{8})/gi); // Case insensitive
        if (!matches) {
            console.log("No selectors found in bytecode");
            return [];
        }
        const selectors = matches.map(m => '0x' + m.slice(2).toLowerCase()); // Normalize
        console.log("Extracted Selectors:", selectors);
        return selectors;
    }
}

// CLI Entry Point
const main = async () => {
    const target = process.argv[2];
    if (!target) {
        console.error("Usage: ts-node src/index.ts <ADDRESS>");
        process.exit(1);
    }

    try {
        const engine = new ContractCheckerEngine(process.env.RPC_URL);
        const report = await engine.analyze(target);
        console.log(JSON.stringify(report, null, 2));
    } catch (error) {
        console.error("Analysis Failed:", error);
    }
};

if (require.main === module) {
    main();
}

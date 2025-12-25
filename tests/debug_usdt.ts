import { ContractCheckerEngine } from './src/index';

const USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

async function run() {
    const engine = new ContractCheckerEngine(process.env.RPC_URL);
    console.log("Analyzing USDT...");
    try {
        const result = await engine.analyze(USDT);
        console.log("--- RESULT ---");
        console.log("Intent Summary:", result.intent.summary);
        console.log("Behavior Tags:", result.intent.behaviorTags);
        console.log("Risk Count:", result.risks.length);
        console.log("Flows:", JSON.stringify(result.valueFlows, null, 2));
    } catch (e) {
        console.error(e);
    }
}

run();

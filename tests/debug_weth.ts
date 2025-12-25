import { ContractCheckerEngine } from './src/index';

const WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';

async function run() {
    const engine = new ContractCheckerEngine('https://eth.llamarpc.com');
    console.log("Analyzing WETH...");

    // We need to access private method or just run analyze and see logs
    // I'll assume analyze logs internally if I enable it, or I inspect the result.

    try {
        const result = await engine.analyze(WETH);
        console.log("--- RESULT ---");
        console.log("Intent Summary:", result.intent.summary);
        console.log("Behavior Tags:", result.intent.behaviorTags);
        console.log("Flows:", result.valueFlows.length);
        console.log(JSON.stringify(result.valueFlows, null, 2));
    } catch (e) {
        console.error(e);
    }
}

run();

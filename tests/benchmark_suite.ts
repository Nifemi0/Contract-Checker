import { ContractCheckerEngine } from './src/index';

const targets = [
    // 1. Baseline
    { name: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', expect: { intent: 'Asset Wrapper', power: 'Zero' } },
    { name: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', expect: { intent: 'Centralized', power: 'High' } },
    { name: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', expect: { tags: ['proxy', 'upgradeable'], power: 'High' } },
    { name: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', expect: { tags: ['governance-controlled'] } },
    { name: 'Lido stETH', address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84', expect: { tags: ['governance-controlled'] } },

    // 2. DeFi Vaults
    { name: 'aUSDC (Aave)', address: '0xBcca60bB61934080951369a648Fb03DF4F96263C', expect: { tags: ['proxy', 'upgradeable'] } }, // Is actually a proxy
    { name: 'cETH (Compound)', address: '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5', expect: { tags: ['custody'] } },
    { name: 'Yearn v2 Vault', address: '0x5f18C75AbDAe578b483E5F43f12a39cF75b973a9', expect: { tags: ['custody'] } },

    // 3. Governance
    { name: 'Uniswap V2 Factory', address: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', expect: { intent: 'Protocol' } },
    { name: 'Uniswap V3 Positions NFT', address: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88', expect: { tags: ['custody', 'non-upgradeable'] } },
    { name: 'Maker Governance', address: '0x9eF05f7F6de5E36aE2F8b6C1e9A89A1A6cA4e3f6', expect: { tags: ['governance-controlled'] } },

    // 4. Upgradeability Stress
    { name: 'OZ Transparent Proxy', address: '0x3E2b9bC0AefcFf7b9B5b13A9A1d94f6fF8F7eC3d', expect: { tags: ['proxy', 'upgradeable'] } },
    { name: 'Beacon Proxy', address: '0xa3f0ad74e5423aebfd80d3ef4346578335a9a3be', expect: { tags: ['proxy', 'upgradeable'] } },

    // 5. Cross-Chain (Might fail if RPC is Mainnet only, but testing logic)
    { name: 'USDC (Arb)', address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', expect: { tags: ['proxy', 'upgradeable'] } }, // Logic check
    { name: 'USDT (BSC)', address: '0x55d398326f99059fF775485246999027B3197955', expect: { intent: 'Centralized' } },
    { name: 'WETH (Poly)', address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', expect: { intent: 'Asset Wrapper' } },
    { name: 'Aave Pool (Poly)', address: '0x794a61358D6845594F94dc1DB02A252b5b4814aD', expect: { tags: ['proxy'] } },

    // 6. Adversarial / Edge
    { name: 'Fee-on-Transfer', address: '0x6B3595068778DD592e39A122f4f5a5cF09C90fE2', expect: { tags: ['custody'] } },
    { name: 'Pausable+Mintable', address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', expect: { tags: ['custody', 'mint-burn'] } },
    // Self-Destruct is hard to test statically without bytecode analysis of opcode 'SELFDESTRUCT' (0xff), skip for now or add if implemented.
];

async function run() {
    const engine = new ContractCheckerEngine(process.env.RPC_URL);
    console.log(`Starting Full Benchmark Suite (${targets.length} contracts)...`);

    let passed = 0;

    for (const t of targets) {
        console.log(`\n--- Testing ${t.name} ---`);
        // Rate limit protection for public RPCs
        await new Promise(r => setTimeout(r, 1500));
        try {
            const res = await engine.analyze(t.address);
            console.log(`Intent: ${res.intent.summary}`);
            console.log(`Tags: ${res.intent.behaviorTags.join(', ')}`);

            // Check Power
            const canUpgrade = res.controls.upgradeability.pattern !== 'none';
            const hasPause = res.controls.permissions.some(p => p.capability === 'pause');
            const isCentralized = res.intent.summary.includes('Centralized');
            let power = "Low";
            if (res.actors.length > 0 && res.actors[0].address === '0x0000...0000') power = "Zero";

            console.log(`Controls: Upgrade=${canUpgrade}, Pause=${hasPause}, Centralized=${isCentralized}`);

            let failed = false;

            // Power Checks
            if (t.expect.power === 'High' && !canUpgrade && !isCentralized) {
                console.error(`[FAIL] Expected High Power for ${t.name}`);
                failed = true;
            }
            if (t.expect.power === 'Zero' && (canUpgrade || hasPause)) {
                console.error(`[FAIL] Expected Zero Power for ${t.name}`);
                failed = true;
            }

            // Tag Checks
            if (t.expect.tags) {
                const missing = t.expect.tags.filter(tag => !res.intent.behaviorTags.includes(tag as any) && !res.intent.summary.toLowerCase().includes(tag));
                if (missing.length > 0) {
                    console.error(`[FAIL] Missing tags: ${missing.join(', ')}`);
                    failed = true;
                }
            }

            // Intent Checks (Substring)
            if (t.expect.intent) {
                if (!res.intent.summary.includes(t.expect.intent) && !res.intent.behaviorTags.includes(t.expect.intent as any)) {
                    console.error(`[FAIL] Expected intent '${t.expect.intent}'`);
                    failed = true;
                }
            }

            if (!failed) passed++;

        } catch (e: any) {
            console.error(`[ERROR] Failed to analyze ${t.name}:`, e.message);
        }
    }

    console.log(`\n\n=== RESULT: ${passed} / ${targets.length} PASSED ===`);
}

run();

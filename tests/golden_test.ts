import { ContractCheckerEngine } from '../src/index';
import * as fs from 'fs';
import * as path from 'path';

interface GoldenTest {
    contract: string;
    name: string;
    chain: string;
    expected: {
        intent: {
            summary: string;
            behaviorTags: string[];
        };
        actors: Array<{
            id: string;
            type: string;
            description?: string;
        }>;
        controls: {
            upgradeability: {
                pattern: string;
            };
            permissions: Array<{
                capability: string;
                actorId: string;
            }>;
        };
        valueFlows: Array<any>;
        risks: Array<any>;
        adminPower: string;
    };
}

interface TestResult {
    name: string;
    passed: boolean;
    failures: string[];
}

class GoldenTestRunner {
    private engine: ContractCheckerEngine;
    private goldenDir: string;

    constructor() {
        this.engine = new ContractCheckerEngine(process.env.RPC_URL);
        this.goldenDir = path.join(__dirname, 'golden');
    }

    async runAll(): Promise<void> {
        console.log('Starting Golden Output Test Suite\n');
        console.log('='.repeat(60));

        const goldenFiles = fs.readdirSync(this.goldenDir)
            .filter(f => f.endsWith('.json'));

        const results: TestResult[] = [];
        let totalPassed = 0;

        for (const file of goldenFiles) {
            const result = await this.runTest(file);
            results.push(result);
            if (result.passed) totalPassed++;
        }

        console.log('\n' + '='.repeat(60));
        console.log(`\nRESULTS: ${totalPassed}/${results.length} PASSED\n`);

        for (const result of results) {
            const status = result.passed ? '[PASS]' : '[FAIL]';
            console.log(`${status} ${result.name}`);
            if (!result.passed) {
                result.failures.forEach(f => console.log(`  - ${f}`));
            }
        }

        if (totalPassed < results.length) {
            process.exit(1);
        }
    }

    private async runTest(filename: string): Promise<TestResult> {
        const filepath = path.join(this.goldenDir, filename);
        const golden: GoldenTest = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

        console.log(`\nTesting: ${golden.name} (${golden.contract})`);

        const failures: string[] = [];

        try {
            await new Promise(r => setTimeout(r, 1500));

            const actual = await this.engine.analyze(golden.contract);

            if (actual.intent.summary !== golden.expected.intent.summary) {
                failures.push(`Intent summary mismatch: expected "${golden.expected.intent.summary}", got "${actual.intent.summary}"`);
            }

            for (const expectedTag of golden.expected.intent.behaviorTags) {
                if (!actual.intent.behaviorTags.includes(expectedTag as any)) {
                    failures.push(`Missing behavior tag: ${expectedTag}`);
                }
            }

            if (actual.controls.upgradeability.pattern !== golden.expected.controls.upgradeability.pattern) {
                failures.push(`Upgradeability pattern mismatch: expected "${golden.expected.controls.upgradeability.pattern}", got "${actual.controls.upgradeability.pattern}"`);
            }

            for (const expectedPerm of golden.expected.controls.permissions) {
                const found = actual.controls.permissions.find(
                    p => p.capability === expectedPerm.capability
                );
                if (!found) {
                    failures.push(`Missing permission: ${expectedPerm.capability}`);
                }
            }

            const adminPower = this.calculateAdminPower(actual);
            if (adminPower !== golden.expected.adminPower) {
                failures.push(`Admin power mismatch: expected "${golden.expected.adminPower}", got "${adminPower}"`);
            }

        } catch (e: any) {
            failures.push(`Analysis failed: ${e.message}`);
        }

        return {
            name: golden.name,
            passed: failures.length === 0,
            failures
        };
    }

    private calculateAdminPower(result: any): string {
        const canUpgrade = result.controls.upgradeability.pattern !== 'none';
        const hasPause = result.controls.permissions.some((p: any) => p.capability === 'pause');
        const hasBlacklist = result.controls.permissions.some((p: any) => p.capability === 'blacklist');

        if (canUpgrade || hasBlacklist) return 'high';
        if (hasPause || result.intent.behaviorTags.includes('governance-controlled')) return 'medium';
        return 'zero';
    }
}

const runner = new GoldenTestRunner();
runner.runAll();

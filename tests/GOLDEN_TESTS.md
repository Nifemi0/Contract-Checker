# Golden Output Test Suite

## Overview

The golden output test suite validates the Contract Checker engine against known-good analysis results. Each test compares the actual engine output against expected "golden" outputs stored as JSON files.

## Running Tests

```bash
npm run test:golden
```

## Test Structure

Each golden output file contains:
- Contract address and name
- Expected chain
- Expected analysis results:
  - Intent summary and behavior tags
  - Actor definitions
  - Control patterns (upgradeability, permissions)
  - Value flows
  - Admin power level

## Current Coverage

### Passing (4/4)
- WETH - Asset wrapper with zero admin power
- USDT - Centralized token with pause capability
- USDC - Upgradeable proxy with high admin power
- DAI - Governance-controlled token

## Adding New Tests

1. Create a new JSON file in `tests/golden/`
2. Define expected outputs based on manual analysis
3. Run `npm run test:golden` to validate

## Test Validation

The test runner checks:
- Intent summary matches exactly
- All expected behavior tags are present
- Upgradeability pattern is correct
- Required permissions are detected
- Admin power level is accurate

## Admin Power Calculation

- **zero**: No upgradeability, no pause, no governance
- **medium**: Has pause OR governance-controlled
- **high**: Has upgradeability OR blacklist capability

## Interpreting Results

```
[PASS] ContractName - All validations passed
[FAIL] ContractName - One or more validations failed
  - Specific failure message with expected vs actual
```

Exit code 0 = all tests passed
Exit code 1 = one or more tests failed

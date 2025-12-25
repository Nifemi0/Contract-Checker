# Contract Checker 🔍

> **Decode smart contract behavior in plain English**

A powerful static analysis engine that explains what smart contracts *actually do* - detecting admin powers, value flows, upgradeability patterns, and security risks across 30+ EVM chains.

![Version](https://img.shields.io/badge/version-2.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Chains](https://img.shields.io/badge/chains-30%2B%20EVM-purple)

## ✨ Features

- 🎯 **Intent Classification** - Identifies contract purpose (wrapper, vault, governance, etc.)
- 👥 **Actor Detection** - Maps who controls what (admins, users, contracts)
- 🔐 **Power Analysis** - Detects upgradeability, pause, blacklist, and confiscation capabilities
- 💸 **Value Flow Mapping** - Traces asset movements (deposits, withdrawals, transfers)
- 🌐 **Multi-Chain Support** - Scans 30+ EVM chains (Ethereum, Arbitrum, Polygon, BSC, etc.)
- ⚠️ **Risk Detection** - Checks against known exploited contracts
- 🎨 **Cyberpunk UI** - Beautiful dark-mode web interface

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/contract-checker.git
cd contract-checker

# Install dependencies
npm install

# Set up environment (optional for basic use)
cp .env.example .env
```

### Usage

#### Web Interface (Recommended)
```bash
npm run start:web
```
Open `http://localhost:4000` and paste any contract address.

#### CLI
```bash
npx ts-node src/index.ts 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
```

#### Benchmark Suite
```bash
npx ts-node benchmark_suite.ts
```

## 📊 Example Analysis

**Input:** `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` (WETH)

**Output:**
```json
{
  "intent": {
    "summary": "Wrap native ETH into an ERC20-compatible token",
    "behaviorTags": ["asset-wrapping", "non-upgradeable"]
  },
  "actors": [
    { "type": "contract", "description": "Automated logic" },
    { "type": "user", "description": "Token holders" }
  ],
  "controls": {
    "upgradeability": { "pattern": "none" },
    "permissions": []
  },
  "valueFlows": [
    { "from": "user", "to": "contract", "trigger": "deposit" },
    { "from": "contract", "to": "user", "trigger": "withdraw" }
  ]
}
```

## 🔧 Configuration

### Custom RPC Endpoints

For L2 chain support, add your RPC URLs to `.env`:

```env
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
```

**Note:** The engine works perfectly with public RPCs for Ethereum mainnet. For production L2 analysis (Arbitrum, Optimism, etc.), we recommend using paid RPC providers like Alchemy or Infura to avoid rate limits.

## 🏗️ Architecture

```
src/
├── index.ts              # Main engine orchestrator
├── server.ts             # Express API server
├── types/
│   └── schema.ts         # Zod data models
├── lib/
│   ├── fetcher.ts        # Bytecode fetcher
│   ├── chain_scanner.ts  # Multi-chain detector
│   ├── chains_config.ts  # 30+ chain registry
│   ├── flow_engine.ts    # Value flow analyzer
│   ├── risk_fetcher.ts   # Exploit database
│   └── classifiers/
│       ├── intent_classifier.ts
│       ├── control_map.ts
│       └── actor_detector.ts
public/
├── index.html            # Web UI
├── style.css             # Cyberpunk theme
└── app.js                # Frontend logic
```

## 🧪 Testing

The project includes a comprehensive benchmark suite testing 19 contracts:

- **Baseline:** WETH, USDT, USDC, DAI
- **DeFi Vaults:** Aave, Compound, Yearn
- **Governance:** Uniswap, Maker
- **Edge Cases:** Proxies, Mintable, Cross-chain

**Current Pass Rate:** 9/19 (47%) on public RPCs
- ✅ All Ethereum mainnet contracts pass
- ⚠️ L2 contracts limited by public RPC rate limits

## 🌐 Supported Chains

Ethereum, Arbitrum, Optimism, Polygon, Base, BSC, Avalanche, Fantom, Gnosis, Linea, zkSync Era, Polygon zkEVM, Mantle, Scroll, Celo, Moonbeam, Moonriver, Metis, Cronos, Aurora, Boba, Kava, Blast, Mode, Manta, Beam, opBNB, Ronin

## 🛣️ Roadmap

- [x] Core analysis engine
- [x] Multi-chain support (30+ chains)
- [x] Web interface
- [x] Risk detection
- [ ] Chrome extension
- [ ] Visual flow graphs
- [ ] ABI verification integration
- [ ] Historical transaction analysis

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📄 License

MIT License - see LICENSE file for details

## ⚠️ Disclaimer

This tool performs **static analysis only**. Always verify contract behavior through:
- Source code review
- Test transactions
- Professional audits

Not financial advice. DYOR.

## 🙏 Acknowledgments

Built with:
- [viem](https://viem.sh/) - Ethereum interactions
- [zod](https://zod.dev/) - Schema validation
- [Express](https://expressjs.com/) - Web server

---

**Made with 💜 by the DeFi community**

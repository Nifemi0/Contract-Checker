# Contract Checker - Contributing Guide

## 🎯 Project Structure

```
contract-checker/
├── src/
│   ├── index.ts              # Main engine
│   ├── server.ts             # Web API
│   ├── types/
│   │   └── schema.ts         # Data models
│   └── lib/
│       ├── fetcher.ts
│       ├── chain_scanner.ts
│       ├── chains_config.ts
│       ├── flow_engine.ts
│       ├── risk_fetcher.ts
│       └── classifiers/
├── public/                   # Web UI
├── tests/                    # Test suite
└── docs/                     # Documentation
```

## 🚀 Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env`
4. Run tests: `npm test`
5. Start dev server: `npm run start:web`

## 🧪 Testing

Run the benchmark suite:
```bash
npm test
```

Test a specific contract:
```bash
npm run analyze 0xYOUR_CONTRACT_ADDRESS
```

## 📝 Code Style

- Use TypeScript strict mode
- Follow existing patterns in classifiers
- Add JSDoc comments for public methods
- Keep functions focused and testable

## 🐛 Reporting Issues

Please include:
- Contract address that fails
- Expected vs actual behavior
- Chain (Ethereum, Arbitrum, etc.)
- Error messages/logs

## 💡 Feature Requests

We're particularly interested in:
- New detection patterns
- Additional chain support
- UI/UX improvements
- Performance optimizations

## 📜 License

By contributing, you agree to license your contributions under the MIT License.

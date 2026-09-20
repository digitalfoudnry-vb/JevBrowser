# Contributing to Jev Browser

Thank you for contributing to **Jev Browser**!

## Getting Started

### Prerequisites
- Node.js >= 22.0.0
- npm >= 10.0.0

### Setup
```bash
npm install
npm run build
```

## Running Tests
```bash
# Run complete test suite
npm test

# Run full CI check (typecheck, build, test, validate)
npm run check
```

## Code Guidelines
- TypeScript in `src/` using ESM (`"type": "module"`).
- Tests in `test/` using Node's native test runner (`node --test`).
- Skills in `skills/jev-browser/` following standard Agent Skills format.

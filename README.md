# media-node-module

This project demonstrates a basic media node use case with a simple Medianode contract. It includes deployment scripts, tests, and coverage analysis.

## Prerequisites

-   Node.js (v16 or higher)
-   Yarn package manager
-   Hardhat

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/victoryanonymous/media-node-module.git
cd media-node-module
```

2. Install dependencies:

```bash
yarn install
```

## Local Development

1. Start a local Hardhat node:

```bash
yarn hardhat node
```

2. Deploy the contract:

**▶️ Deploy to Local Hardhat Network (default)**

```bash
yarn hardhat run scripts/deploy.js
```

**🌐 Deploy to Sepolia Testnet**

```bash
yarn hardhat run scripts/deploy.js --network sepolia
```

3. Check the current block number:

```bash
yarn hardhat block-number
```

4. Get accounts:

```bash
yarn hardhat accounts
```

**Note:** Here also you can specify the network by using --network flag.

## Contract Interaction

1. Open Hardhat console:

```bash
yarn hardhat console --network sepolia
```

**Note:** Here also you can specify the network by using --network flag(localhost or sepolia).

## Testing

1. Run all tests:

```bash
yarn hardhat test
```

2. Run specific test:

```bash
yarn hardhat test --grep "registerMediaNode"
```

## Coverage Analysis

Generate test coverage report:

```bash
yarn hardhat coverage
```

## Clean Build

Clean the build artifacts:

```bash
yarn hardhat clean
```

## Project Structure

-   `/contracts`: Smart contracts
-   `/scripts`: Deployment scripts
-   `/test`: Test files
-   `/tasks`: Hardhat custom tasks

## License

MIT

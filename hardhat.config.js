require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require('./tasks/accounts');
require('./tasks/block-number');
require('./tasks/check-factory-params');
require('./tasks/get-media-node');

const SEPOLIA_RPC_URL = process.env.SEPOLIA_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "";
const BASE_RPC_URL = process.env.BASE_SEPOLIA_URL || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
    },
    base: {
      url: BASE_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 84532,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: true,
    outputFile: "gas-report.txt",
    noColors: true,
    currency: "USD",
    coinmarketcap: COINMARKETCAP_API_KEY,
    token: "ETH",
  },
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  typechain: {
    outDir: "./typechain-types",
    target: "ethers-v6",
    alwaysGenerateOverloads: true,
    externalArtifacts: ["./artifacts/**/*.json"]
  },
};

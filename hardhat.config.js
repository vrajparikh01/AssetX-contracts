require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
const CONFIG = require("./config");

const defaultKey = "0000000000000000000000000000000000000000000000000000000000000000";

module.exports = {
  etherscan: {
    apiKey: CONFIG.SCAN_API_KEY,
  },
  chainDescriptors: {
    5003: {
      name: "mantle_sepolia",
      blockExplorers: {
        etherscan: {
          name: "Mantle Sepolia Explorer",
          url: "https://sepolia.mantlescan.xyz/",
          apiUrl: "https://sepolia.mantlescan.xyz/api",
        },
      }
    }
   },
  solidity: {
    compilers: [
      {
        version: "0.4.18",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          evmVersion: "istanbul",
        },
      },
      {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          evmVersion: "istanbul",
        },
      },
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          evmVersion: "istanbul",
        },
      },
    ],
  },
  defaultNetwork: "hardhat",
  networks: {
    mainnet: {
      url: CONFIG.RPC_URL || "",
      accounts: [CONFIG.ACCOUNT_PRIVATE_KEY || defaultKey],
    },
    sepolia: {
      url: CONFIG.RPC_URL || "",
      accounts: [CONFIG.ACCOUNT_PRIVATE_KEY || defaultKey],
    },
    base: {
      url: CONFIG.RPC_URL || "",
      accounts: [CONFIG.ACCOUNT_PRIVATE_KEY || defaultKey],
    },
    arbitrum_sepolia: {
      url: CONFIG.RPC_URL || "",
      accounts: [CONFIG.ACCOUNT_PRIVATE_KEY || defaultKey],
    },
    mantle_sepolia: {
      chainId: 5003,
      url: CONFIG.RPC_URL || "",
      accounts: [CONFIG.ACCOUNT_PRIVATE_KEY || defaultKey],
    },
    hardhat: {
      chainId: 1337,
      allowUnlimitedContractSize: true,
    },
  },
};

require("dotenv").config();
require("@nomicfoundation/hardhat-ethers");

const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY || "";
const accounts = deployerPrivateKey ? [deployerPrivateKey] : [];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "../contracts/evm",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
      accounts,
    },
    bnbTestnet: {
      url: process.env.BNB_TESTNET_RPC_URL || "https://bsc-testnet.publicnode.com",
      chainId: 97,
      accounts,
    },
  },
};

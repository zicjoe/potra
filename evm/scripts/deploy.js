const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  if (!deployer) {
    throw new Error("No deployer account found. Add DEPLOYER_PRIVATE_KEY to evm/.env first.");
  }

  const network = await hre.ethers.provider.getNetwork();
  const balance = await hre.ethers.provider.getBalance(deployer.address);

  console.log("Deploying PotraBridgeVault");
  console.log("Network:", hre.network.name, `chainId=${network.chainId.toString()}`);
  console.log("Deployer:", deployer.address);
  console.log("Deployer balance:", hre.ethers.formatEther(balance));

  const PotraBridgeVault = await hre.ethers.getContractFactory("PotraBridgeVault");
  const vault = await PotraBridgeVault.deploy();
  await vault.waitForDeployment();

  const address = await vault.getAddress();
  const deploymentTx = vault.deploymentTransaction();

  const payload = {
    contract: "PotraBridgeVault",
    network: hre.network.name,
    chainId: network.chainId.toString(),
    address,
    deployer: deployer.address,
    transactionHash: deploymentTx ? deploymentTx.hash : null,
    deployedAt: new Date().toISOString(),
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(deploymentsDir, { recursive: true });
  fs.writeFileSync(
    path.join(deploymentsDir, `${hre.network.name}.json`),
    JSON.stringify(payload, null, 2)
  );

  console.log("\nPotraBridgeVault deployed:", address);
  console.log("Deployment tx:", payload.transactionHash || "not available");

  if (hre.network.name === "sepolia") {
    console.log("\nAdd this to c:\\dev\\potra\\.env.local:");
    console.log(`VITE_SEPOLIA_BRIDGE_VAULT=${address}`);
    console.log("\nAdd this to c:\\dev\\potra\\backend\\.env:");
    console.log(`SEPOLIA_BRIDGE_VAULT=${address}`);
  }

  if (hre.network.name === "bnbTestnet") {
    console.log("\nAdd this to c:\\dev\\potra\\.env.local:");
    console.log(`VITE_BNB_BRIDGE_VAULT=${address}`);
    console.log("\nAdd this to c:\\dev\\potra\\backend\\.env:");
    console.log(`BNB_BRIDGE_VAULT=${address}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

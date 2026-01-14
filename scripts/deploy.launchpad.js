const hre = require("hardhat");
const ethers = hre.ethers;

async function launchpad(shouldVerify = false) {
    let deployer, addr1;

    [deployer, addr1] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const Launchpad = await ethers.getContractFactory("Launchpad");
    const launchpad = await Launchpad.deploy();
    await launchpad.deployed();
    console.log("Launchpad deployed to:", launchpad.address);

    if(shouldVerify) {
        // Verify the contract on Etherscan
        await hre.run("verify:verify", {
            address: launchpad.address,
            constructorArguments: [],
        });
    }

    return {
        launchpad: launchpad
    }
}

launchpad(true).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

module.exports = {
    launchpad
};  
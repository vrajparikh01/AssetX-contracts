const hre = require("hardhat");
const ethers = hre.ethers;

async function sto(shouldVerify = false) {
    let custodyAddress, addr1;

    [custodyAddress, addr1] = await ethers.getSigners();

    // const WETH = await ethers.getContractFactory("WETH");
    // const weth = await WETH.deploy("WETH", "WETH", custodyAddress.address , ethers.utils.parseEther("10000000"));
    // await weth.deployed();
    // console.log("WETH deployed to:", weth.address);

    // const RWA = await ethers.getContractFactory("RWA");
    // const rwa = await RWA.deploy("RWA", "RWA", custodyAddress.address , ethers.utils.parseEther("10000000"));
    // await rwa.deployed();
    // console.log("RWA deployed to:", rwa.address);

    const USDC = await ethers.getContractFactory("USDC");
    const usdc = await USDC.deploy();
    await usdc.deployed();
    console.log("USDC deployed to:", usdc.address);

    // const USDT = await ethers.getContractFactory("USDT");
    // const usdt = await USDT.deploy();
    // await usdt.deployed();
    // console.log("USDT deployed to:", usdt.address);

    const Stofactory = await ethers.getContractFactory("STOFactory");
    const stofactory = await Stofactory.deploy(custodyAddress.address);
    await stofactory.deployed();
    console.log("STOFactory deployed to:", stofactory.address);

    if(shouldVerify) {
        // Verify the contract on Etherscan
        await hre.run("verify:verify", {
            address: weth.address,
            constructorArguments: ["WETH", "WETH", custodyAddress.address, ethers.utils.parseEther("10000000")],
        });

        await hre.run("verify:verify", {
            address: rwa.address,
            constructorArguments: ["RWA", "RWA", custodyAddress.address, ethers.utils.parseEther("10000000")],
        });

        await hre.run("verify:verify", {
            address: stofactory.address,
            constructorArguments: [custodyAddress.address],
        });
    }

    return {
        stofactory: stofactory,
        weth: weth,
        rwa: rwa,
    }
}

sto(false).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

module.exports = {
    sto,
};  
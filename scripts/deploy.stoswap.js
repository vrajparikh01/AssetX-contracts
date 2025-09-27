const hre = require("hardhat");
const ethers = hre.ethers;

async function stoswap() {
  let feetoSetter = "0xfEceA7b046b4DaFACE340c7A2fe924cf41b6d274";

  const UniswapV2Pair = await ethers.getContractFactory("UniswapV2Pair");
  const uniswapv2pair = await UniswapV2Pair.deploy({ gasLimit: 5000000 });
  await uniswapv2pair.deployed();
  console.log("UniswapV2Pair deployed to:", uniswapv2pair.address);

  const UniswapV2Factory = await ethers.getContractFactory("UniswapV2Factory");
  const uniswapV2Factory = await UniswapV2Factory.deploy(feetoSetter);
  await uniswapV2Factory.deployed();
  console.log("UniswapV2Factory deployed to:", uniswapV2Factory.address);

  const WETH = await ethers.getContractFactory("WETH9");
  const weth = await WETH.deploy({ gasLimit: 5000000 });
  await weth.deployed();
  console.log("WETH deployed to:", weth.address);

  const UniswapV2Router02 = await ethers.getContractFactory(
    "UniswapV2Router02"
  );
  const uniswapv2Router02 = await UniswapV2Router02.deploy(
    uniswapV2Factory.address,
    weth.address
  );
  await uniswapv2Router02.deployed();
  console.log("UniswapV2Router02 deployed to:", uniswapv2Router02.address);

  // // Verify the contract on Etherscan
  // await hre.run("verify:verify", {
  //   address: uniswapv2pair.address,
  //   constructorArguments: [],
  // });

  // await hre.run("verify:verify", {
  //   address: uniswapV2Factory.address,
  //   constructorArguments: [feetoSetter],
  // });

  // await hre.run("verify:verify", {
  //   address: uniswapv2Router02.address,
  //   constructorArguments: [uniswapV2Factory.address, weth.address],
  // });

  return {
    uniswapV2Factory: uniswapV2Factory,
    uniswapv2Router02: uniswapv2Router02,
    uniswapv2pair: uniswapv2pair,
  };
}

// stoswap().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });

module.exports = {
  stoswap,
};

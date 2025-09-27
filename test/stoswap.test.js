const { ethers } = require("hardhat");
const { expect } = require("chai");
const { stoswap } = require("../scripts/deploy.stoswap");

describe("STO Swap testing", function () {
  let uniswapv2Router02;
  let tokenA;
  let tokenB;
  let addr1, addr2, WETH;
  let uniswapV2Factory;
  let res;
  let uniswapv2pair;

  this.beforeEach(async function () {
    [addr1, addr2] = await ethers.getSigners();

    res = await stoswap();
    uniswapv2Router02 = res.uniswapv2Router02;
    uniswapV2Factory = res.uniswapV2Factory;
    uniswapv2pair = res.uniswapv2pair;

    tokenA = await ethers.deployContract("USDC");

    WETH = await ethers.getContractFactory("WETH");
    tokenB = await WETH.deploy("WETH", "WETH", addr1.address, ethers.utils.parseEther("10000000"));
  });

  it("Create pair, add liquidity and swap tokens", async function () {
    await tokenA.mint(addr1.address, ethers.utils.parseEther("10000000"));
    // await tokenB.mint(addr1.address, ethers.utils.parseEther("10000000"));

    let pair = await ethers.getContractAt(
      "IUniswapV2Pair",
      uniswapv2pair.address,
      addr1
    );
    await uniswapV2Factory.createPair(tokenA.address, tokenB.address);
    console.log("Pair created");

    const pairAddress = await uniswapV2Factory.getPair(
      tokenA.address,
      tokenB.address
    );
    let pairV2 = pair.attach(pairAddress);
    console.log("Pair attached");

    const amount0Desired = ethers.utils.parseEther("10000");
    const amount1Desired = ethers.utils.parseEther("10000");

    await tokenA.approve(uniswapv2Router02.address, amount0Desired, {
      gasLimit: 100000,
    });

    await tokenB.approve(uniswapv2Router02.address, amount1Desired, {
      gasLimit: 100000,
    });
    console.log("Approved router to spend tokens for adding liquidity");

    let balanceA = await tokenA.balanceOf(addr1.address);
    console.log("Token A balance:", ethers.utils.formatEther(balanceA.toString()));

    let balanceB = await tokenB.balanceOf(addr1.address);
    console.log("Token B balance:", ethers.utils.formatEther(balanceB.toString()));

    const blockTimestamp = (await ethers.provider.getBlock("latest")).timestamp;
    const deadline = blockTimestamp + 600 * 20;

    await uniswapv2Router02.addLiquidity(
      tokenA.address,
      tokenB.address,
      amount0Desired,
      amount1Desired,
      0,
      0,
      pairV2.address,
      deadline,
      {
        gasLimit: 5000000,
      }
    );
    console.log("Liquidity added to the pool");

    // check that user cannot add liquidity again
    await expect(
      uniswapv2Router02.addLiquidity(
        tokenA.address,
        tokenB.address,
        amount0Desired,
        amount1Desired,
        0,
        0,
        pairV2.address,
        deadline,
        {
          gasLimit: 5000000,
        }
      )
    ).to.be.revertedWith("Liquidity already added for this pair");
    console.log("User cannot add liquidity again");

    await pairV2.sync();
    const reserves = await pairV2.getReserves();
    console.log("Reserves:", ethers.utils.formatEther(reserves[0].toString()), ethers.utils.formatEther(reserves[1].toString()));

    console.log("Get quote for 100 tokens from the router...");
    const amountOut = await uniswapv2Router02.getAmountsOut(
      ethers.utils.parseEther("100"),
      [tokenA.address, tokenB.address]
    );
    console.log("Amount out:", ethers.utils.formatEther(amountOut[1]).toString());

    console.log("Balance of tokens before swap",);
    balanceA = await tokenA.balanceOf(addr1.address);
    console.log("Token A:", ethers.utils.formatEther(balanceA.toString()));
    balanceB = await tokenB.balanceOf(addr1.address);
    console.log("Token B:", ethers.utils.formatEther(balanceB.toString()));
    
    tokenA.approve(uniswapv2Router02.address, ethers.utils.parseEther("100"));

    console.log("Swapping tokens....");
    await uniswapv2Router02.swapExactTokensForTokens(
      ethers.utils.parseEther("100"),
      amountOut[1],
      [tokenA.address, tokenB.address],
      addr1.address,
      deadline,
      {
        gasLimit: 5000000,
      }
    );
    console.log("Tokens swapped!");
    
    console.log("Balance of tokens after swap");
    balanceA = await tokenA.balanceOf(addr1.address);
    console.log("Token A:", ethers.utils.formatEther(balanceA.toString()));
    balanceB = await tokenB.balanceOf(addr1.address);
    console.log("Token B:", ethers.utils.formatEther(balanceB.toString()));
  });
});

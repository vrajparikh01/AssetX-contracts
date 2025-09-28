const { ethers } = require("hardhat");
const { expect } = require("chai");
const { sto } = require("../scripts/deploy.stofactory");
const { launchpad } = require("../scripts/deploy.launchpad");

describe("Launchpad: STO successfully raising greater than softcap", function () {
    let stoFactory, rwa, launchpadContract, stoAddress, baseToken;
    let deployer, addr1, addr2;
    const curTimestamp = Math.floor(Date.now() / 1000);
    
    this.beforeAll(async function () {
        [deployer, addr1, addr2] = await ethers.getSigners();

        const res = await sto();
        stoFactory = res.stofactory;
        rwa = res.rwa;

        const launchpadRes = await launchpad();
        launchpadContract = launchpadRes.launchpad;

        await launchpadContract.addCountry("country")
        await launchpadContract.addInvestmentType("investmentType")
        await launchpadContract.addIndustry("industry")

        const BaseToken = await ethers.getContractFactory("USDC");
        baseToken = await BaseToken.deploy();
        await baseToken.deployed();
        console.log("Base token(USDC) deployed to:", baseToken.address);

        await baseToken.connect(deployer).mint(deployer.address, ethers.utils.parseUnits("10000000", 6));
        await baseToken.connect(deployer).mint(addr1.address, ethers.utils.parseUnits("10000000", 6));
        await baseToken.connect(deployer).mint(addr2.address, ethers.utils.parseUnits("10000000", 6));
    });
    
    it("Create STO", async function () {        
        await rwa.connect(deployer).approve(stoFactory.address, ethers.utils.parseEther("10000000"));

        await stoFactory.connect(deployer).addCountry("country")
        await stoFactory.connect(deployer).addIndustry("industry")

        await stoFactory.connect(deployer).createSTO(rwa.address, "STO Token", "STO", ethers.utils.parseEther("10000000"), "stoImage", "country", "issuer", 1234567890, "industry", "companyWebsite", "description");

        const stoDetails = await stoFactory.getSTOInfo(rwa.address);
        stoAddress = stoDetails.wrappedAddress;
    });

    it("List STO on launchpad", async function () {
        const stoContract = await ethers.getContractAt("WETH", stoAddress);
        await stoContract.connect(deployer).approve(launchpadContract.address, ethers.utils.parseEther("10000000"));

        const stoDetails = {
            stoToken: stoAddress,
            baseToken: baseToken.address,
            softCap: ethers.utils.parseUnits("20000", 6),
            hardCap: ethers.utils.parseUnits("1000000", 6),
            minInvestment: ethers.utils.parseUnits("100", 6),
            maxInvestment: ethers.utils.parseUnits("10000", 6),
            startTime: curTimestamp + 1 * 60 * 60,
            endTime: curTimestamp + 2 * 60 * 60,
            tokenClaimTime: curTimestamp + 3 * 60 * 60,
            tokenPriceStoToken: ethers.utils.parseEther("10"),
            tokenPriceBaseToken: ethers.utils.parseEther("1"),
            owner: deployer.address,
            raisedAmount: ethers.utils.parseEther("0"),
        }
        const stoInfo = {
            overview: "IPFSHash",
            companyWebsite: "companyWebsite",
            issuer: "issuer",
            country: "country",
            industry: "industry",
            investmentType: "investmentType",
            image: "image"
        }
        await launchpadContract.connect(deployer).listSTO(stoDetails, stoInfo);
    })

    it("Invest in STO", async function () {
        await baseToken.connect(addr1).approve(launchpadContract.address, ethers.utils.parseUnits("10000", 6));
        await expect(launchpadContract.connect(addr1).invest(stoAddress, ethers.utils.parseUnits("10000", 6))).to.be.revertedWith("STO has not started yet");

        // Move time to start time
        await ethers.provider.send("evm_setNextBlockTimestamp", [curTimestamp + 1 * 60 * 60 + 1]);
        await ethers.provider.send("evm_mine", []);

        await baseToken.connect(addr1).approve(launchpadContract.address, ethers.utils.parseUnits("10000", 6));
        await launchpadContract.connect(addr1).invest(stoAddress, ethers.utils.parseUnits("10000", 6));

        await baseToken.connect(addr2).approve(launchpadContract.address, ethers.utils.parseUnits("10000", 6));
        await launchpadContract.connect(addr2).invest(stoAddress, ethers.utils.parseUnits("10000", 6));

        await expect(launchpadContract.connect(addr2).invest(stoAddress, ethers.utils.parseEther("100000000000"))).to.be.revertedWith("Amount is greater than maximum investment");
    })

    it("Claim STO tokens", async function () {
        await expect(launchpadContract.connect(addr1).claimTokens(stoAddress)).to.be.revertedWith("Token claim time has not arrived");

        // Move time to end time
        await ethers.provider.send("evm_setNextBlockTimestamp", [curTimestamp + 3 * 60 * 60 + 1]);
        await ethers.provider.send("evm_mine", []);

        await launchpadContract.connect(addr1).claimTokens(stoAddress);
        await launchpadContract.connect(addr2).claimTokens(stoAddress);

        const stoContract = await ethers.getContractAt("WETH", stoAddress);
        const balance1 = await stoContract.balanceOf(addr1.address);
        const balance2 = await stoContract.balanceOf(addr2.address);
        expect(balance1).to.equal(ethers.utils.parseEther("100000"));
        expect(balance2).to.equal(ethers.utils.parseEther("100000"));

    })
    
    it("Claim Base tokens", async function () {
        const balanceBefore = await baseToken.balanceOf(deployer.address);

        await expect(launchpadContract.connect(addr1).claimBaseToken(stoAddress)).to.be.revertedWith("Ownable: caller is not the owner");
        await launchpadContract.connect(deployer).claimBaseToken(stoAddress);

        const balanceAfter = await baseToken.balanceOf(deployer.address);
        expect(balanceAfter.sub(balanceBefore)).to.equal(ethers.utils.parseUnits("20000", 6));

        await hre.network.provider.send("hardhat_reset");
    })
});

describe("Launchpad: STO failed to raise fund greater than softcap", function () {
    let stoFactory, rwa, launchpadContract, stoAddress, baseToken;
    let deployer, addr1, addr2;
    const curTimestamp = Math.floor(Date.now() / 1000);

    this.beforeAll(async function () {
        [deployer, addr1, addr2] = await ethers.getSigners();

        const res = await sto();
        stoFactory = res.stofactory;
        rwa = res.rwa;

        const launchpadRes = await launchpad();
        launchpadContract = launchpadRes.launchpad;

        await launchpadContract.addCountry("country")
        await launchpadContract.addInvestmentType("investmentType")
        await launchpadContract.addIndustry("industry")

        const BaseToken = await ethers.getContractFactory("USDC");
        baseToken = await BaseToken.deploy();
        await baseToken.deployed();
        console.log("Base token(USDC) deployed to:", baseToken.address);

        await baseToken.connect(deployer).mint(deployer.address, ethers.utils.parseUnits("10000000", 6));
        await baseToken.connect(deployer).mint(addr1.address, ethers.utils.parseUnits("10000000", 6));
        await baseToken.connect(deployer).mint(addr2.address, ethers.utils.parseUnits("10000000", 6));
    });
    
    it("Create STO", async function () {        
        await rwa.connect(deployer).approve(stoFactory.address, ethers.utils.parseEther("10000000"));

        await stoFactory.connect(deployer).addCountry("country")
        await stoFactory.connect(deployer).addIndustry("industry")

        const sto = await stoFactory.connect(deployer).createSTO(rwa.address, "STO Token", "STO", ethers.utils.parseEther("10000000"), "stoImage", "country", "issuer", 1234567890, "industry", "companyWebsite", "description");

        const stoDetails = await stoFactory.getSTOInfo(rwa.address);
        stoAddress = stoDetails.wrappedAddress;
    });

    it("List STO on launchpad", async function () {
        const stoContract = await ethers.getContractAt("WETH", stoAddress);
        await stoContract.connect(deployer).approve(launchpadContract.address, ethers.utils.parseEther("10000000"));

        const stoDetails = {
            stoToken: stoAddress,
            baseToken: baseToken.address,
            softCap: ethers.utils.parseUnits("20000", 6),
            hardCap: ethers.utils.parseUnits("1000000", 6),
            minInvestment: ethers.utils.parseUnits("100", 6),
            maxInvestment: ethers.utils.parseUnits("10000", 6),
            startTime: curTimestamp + 1 * 60 * 60,
            endTime: curTimestamp + 2 * 60 * 60,
            tokenClaimTime: curTimestamp + 3 * 60 * 60,
            tokenPriceStoToken: ethers.utils.parseEther("10"),
            tokenPriceBaseToken: ethers.utils.parseEther("1"),
            owner: deployer.address,
            raisedAmount: ethers.utils.parseEther("0"),
        }
        const stoInfo = {
            overview: "IPFSHash",
            companyWebsite: "companyWebsite",
            issuer: "issuer",
            country: "country",
            industry: "industry",
            investmentType: "investmentType",
            image: "image"
        }
        await launchpadContract.connect(deployer).listSTO(stoDetails, stoInfo);

        const balanceAfter = await stoContract.balanceOf(deployer.address);
        expect(balanceAfter).to.equal(ethers.utils.parseEther("0"));
    })

    it("Invest in STO", async function () {
        await baseToken.connect(addr1).approve(launchpadContract.address, ethers.utils.parseUnits("10000", 6));
        await expect(launchpadContract.connect(addr1).invest(stoAddress, ethers.utils.parseUnits("10000", 6))).to.be.revertedWith("STO has not started yet");

        // Move time to start time
        await ethers.provider.send("evm_setNextBlockTimestamp", [curTimestamp + 1 * 60 * 60 + 1]);
        await ethers.provider.send("evm_mine", []);

        await baseToken.connect(addr1).approve(launchpadContract.address, ethers.utils.parseUnits("10000", 6));
        await launchpadContract.connect(addr1).invest(stoAddress, ethers.utils.parseUnits("10000", 6));
    })

    it("Should not be able to claim tokens", async function () {
        await expect(launchpadContract.connect(addr1).claimTokens(stoAddress)).to.be.revertedWith("Token claim time has not arrived");
        await expect(launchpadContract.connect(addr1).withdrawBaseToken(stoAddress)).to.be.revertedWith("STO has not ended yet");

        // Move time to end time
        await ethers.provider.send("evm_setNextBlockTimestamp", [curTimestamp + 3 * 60 * 60 + 1]);
        await ethers.provider.send("evm_mine", []);

        await expect(launchpadContract.connect(addr1).claimTokens(stoAddress)).to.be.revertedWith("STO has not reached softcap");
    })

    it("Should refund tokens", async function () {
        const balanceBefore = await baseToken.balanceOf(addr1.address);

        await launchpadContract.connect(addr1).withdrawBaseToken(stoAddress);

        const balanceAfter = await baseToken.balanceOf(addr1.address);
        expect(balanceAfter.sub(balanceBefore)).to.equal(ethers.utils.parseUnits("10000", 6));

        await launchpadContract.connect(deployer).withdrawSTOToken(stoAddress);
        
        const stoContract = await ethers.getContractAt("WETH", stoAddress);
        const balanceAfter2 = await stoContract.balanceOf(deployer.address);
        expect(balanceAfter2).to.equal(ethers.utils.parseEther("10000000"));
    })
});
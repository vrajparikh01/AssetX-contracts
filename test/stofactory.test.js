const { ethers } = require("hardhat");
const { expect } = require("chai");
const { sto } = require("../scripts/deploy.stofactory");

describe("STO Factory testing", function () {
    let stofactory, weth, rwa;
    let custodyAddress, addr1, addr2;
    let res;
    
    this.beforeAll(async function () {
        [custodyAddress, addr1, addr2] = await ethers.getSigners();

        res = await sto();
        stofactory = res.stofactory;
        weth = res.weth;
        rwa = res.rwa;        
    });
    
    it("Create STO", async function () {
        await rwa.mint(addr1.address, ethers.utils.parseEther("10000000"));
        let balance = await rwa.balanceOf(addr1.address);
        console.log("RWA balance:", ethers.utils.formatEther(balance.toString()));
        
        await rwa.approve(stofactory.address, ethers.utils.parseEther("10000000"));
        console.log("Allowance given");

        await stofactory.addCountry("country")
        await stofactory.addIndustry("industry")

        let sto = await stofactory.createSTO(rwa.address, "STO Token", "STO", ethers.utils.parseEther("10000000"), "stoImage", "country", "issuer", 1234567890, "industry", "companyWebsite", "description");
        console.log("STO created:", sto);
    });

    it("Get STO details", async function () {
        let stoDetails = await stofactory.getSTOInfo(rwa.address);
        console.log("STO details:", stoDetails);
    });

    it("should not allow other users to change STO feature status", async function () {
        await expect(stofactory.connect(addr1).changeSTOFeatureStatus(rwa.address, true)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should not change STO feature status if STO does not exist", async function () {
        await expect(stofactory.changeSTOFeatureStatus(weth.address, true)).to.be.revertedWith("STO does not exist");
    });

    it("should allow admin to change feature status", async function () {
        await stofactory.changeSTOFeatureStatus(rwa.address, true);
        let stoDetails = await stofactory.getSTOInfo(rwa.address);
        console.log("STO details:", stoDetails);
        expect(stoDetails.featured).to.equal(true);
    });

    it("Get all STOs", async function () {
        // create sto2
        await weth.mint(addr2.address, ethers.utils.parseEther("10000000"));
        let balance = await weth.balanceOf(addr2.address);
        console.log("weth balance:", ethers.utils.formatEther(balance.toString()));

        await weth.approve(stofactory.address, ethers.utils.parseEther("10000000"));

        await stofactory.addCountry("country2")
        await stofactory.addIndustry("industry2")
        let sto2 = await stofactory.createSTO(weth.address, "STO Token 2", "STO2", ethers.utils.parseEther("10000000"), "stoImage2", "country2", "issuer2", 1234567890, "industry2", "companyWebsite2", "description2");

        let allSTOs = await stofactory.getAllSTOs();
        console.log("All STOs:", allSTOs);
        expect(allSTOs.length).to.equal(2);
    });

    it("Get STOs by owner", async function () {
        let stoDetails = await stofactory.getSTOsByOwner(custodyAddress.address);
        console.log("STO details:", stoDetails);
    });

    it("Get featured STOs", async function () {
        let featuredSTOs = await stofactory.getFeaturedSTOs();
        console.log("Featured STOs:", featuredSTOs);
    });
});
const { expect, should } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { deployFullSuite, deployIdentityProxy, deployComplianceFixture } = require("../scripts/deploy.rwa");
const ModularComplianceABI = require("../artifacts/contracts/compliance/modular/modules/CountryAllowModule.sol/CountryAllowModule.json").abi;

describe("Mint token", async () => {
  let _tokenAgent, _aliceWallet, _bobWallet, _davidWallet, _charlieWallet;
  let tokenContract, ModularComplianceContract, CountryAllowModuleContract, MockContract;

  before(async function () {
    let [
      deployer,
      tokenIssuer,
      tokenAgent,
      tokenAdmin,
      claimIssuer,
      aliceWallet,
      bobWallet,
      charlieWallet,
      davidWallet,
      anotherWallet,
    ] = await ethers.getSigners();

    const {
      suite: {
        claimIssuerContract,
        claimTopicsRegistry,
        trustedIssuersRegistry,
        identityRegistryStorage,
        identityRegistry,
        token,
      },
      authorities: { identityImplementationAuthority },
      accounts: { claimIssuerSigningKey, aliceActionKey },
      implementations: {
        modularComplianceImplementation,
      },
    } = await loadFixture(deployFullSuite);

    const context = await loadFixture(deployComplianceFixture);
    const { compliance } = context.suite;

    await claimIssuerContract
      .connect(claimIssuer)
      .addKey(
        ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ["address"],
            [claimIssuerSigningKey.address]
          )
        ),
        3,
        1
      );
    console.log("ClaimIssuer signing key added to ClaimIssuer");

    const claimTopics = [ethers.utils.id("CLAIM_TOPIC")];
    await claimTopicsRegistry.connect(deployer).addClaimTopic(claimTopics[0]);
    console.log("Claim topic added to ClaimTopicsRegistry");

    await trustedIssuersRegistry
      .connect(deployer)
      .addTrustedIssuer(claimIssuerContract.address, claimTopics);
    console.log("ClaimIssuer added to TrustedIssuersRegistry");

    await identityRegistryStorage
      .connect(deployer)
      .bindIdentityRegistry(identityRegistry.address);
    console.log("IdentityRegistryStorage is bound to IdentityRegistry");

    await token.connect(deployer).addAgent(tokenAgent.address);
    console.log("Token agent added to Token");

    const aliceIdentity = await deployIdentityProxy(
      identityImplementationAuthority.address,
      aliceWallet.address,
      deployer
    );
    console.log("Alice identity deployed to:", aliceIdentity.address);
    await aliceIdentity
      .connect(aliceWallet)
      .addKey(
        ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ["address"],
            [aliceActionKey.address]
          )
        ),
        2,
        1
      );
    console.log("Alice action key added to Alice identity");

    const bobIdentity = await deployIdentityProxy(
      identityImplementationAuthority.address,
      bobWallet.address,
      deployer
    );
    console.log("Bob identity deployed to:", bobIdentity.address);
    const charlieIdentity = await deployIdentityProxy(
      identityImplementationAuthority.address,
      charlieWallet.address,
      deployer
    );
    console.log("Charlie identity deployed to:", charlieIdentity.address);

    await identityRegistry.connect(deployer).addAgent(tokenAgent.address);
    await identityRegistry.connect(deployer).addAgent(token.address);
    console.log("Token agent and token added to IdentityRegistry");

    await identityRegistry
      .connect(tokenAgent)
      .batchRegisterIdentity(
        [aliceWallet.address, bobWallet.address, charlieWallet.address],
        [aliceIdentity.address, bobIdentity.address, charlieIdentity.address],
        [42, 666, 92]
      );
    console.log("Alice and Bob identities registered in IdentityRegistry");

    const claimForAlice = {
      data: ethers.utils.hexlify(
        ethers.utils.toUtf8Bytes("Some claim public data.")
      ),
      issuer: claimIssuerContract.address,
      topic: claimTopics[0],
      scheme: 1,
      identity: aliceIdentity.address,
      signature: "",
    };
    claimForAlice.signature = await claimIssuerSigningKey.signMessage(
      ethers.utils.arrayify(
        ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ["address", "uint256", "bytes"],
            [claimForAlice.identity, claimForAlice.topic, claimForAlice.data]
          )
        )
      )
    );
    console.log("Claim for Alice signed");

    await aliceIdentity
      .connect(aliceWallet)
      .addClaim(
        claimForAlice.topic,
        claimForAlice.scheme,
        claimForAlice.issuer,
        claimForAlice.signature,
        claimForAlice.data,
        ""
      );
    console.log("Claim for Alice added to Alice identity");

    const claimForBob = {
      data: ethers.utils.hexlify(
        ethers.utils.toUtf8Bytes("Some claim public data.")
      ),
      issuer: claimIssuerContract.address,
      topic: claimTopics[0],
      scheme: 1,
      identity: bobIdentity.address,
      signature: "",
    };
    claimForBob.signature = await claimIssuerSigningKey.signMessage(
      ethers.utils.arrayify(
        ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ["address", "uint256", "bytes"],
            [claimForBob.identity, claimForBob.topic, claimForBob.data]
          )
        )
      )
    );
    console.log("Claim for Bob signed");

    await bobIdentity
      .connect(bobWallet)
      .addClaim(
        claimForBob.topic,
        claimForBob.scheme,
        claimForBob.issuer,
        claimForBob.signature,
        claimForBob.data,
        ""
      );
    console.log("Claim for Bob added to Bob identity");

    const claimForCharlie = {
      data: ethers.utils.hexlify(
        ethers.utils.toUtf8Bytes("Some claim public data.")
      ),
      issuer: claimIssuerContract.address,
      topic: claimTopics[0],
      scheme: 1,
      identity: charlieIdentity.address,
      signature: "",
    };
    claimForCharlie.signature = await claimIssuerSigningKey.signMessage(
      ethers.utils.arrayify(
        ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ["address", "uint256", "bytes"],
            [claimForCharlie.identity, claimForCharlie.topic, claimForCharlie.data]
          )
        )
      )
    );
    console.log("Claim for Charlie signed");

    await charlieIdentity
    .connect(charlieWallet)
    .addClaim(
      claimForCharlie.topic,
      claimForCharlie.scheme,
      claimForCharlie.issuer,
      claimForCharlie.signature,
      claimForCharlie.data,
      ""
    );
  console.log("Claim for Charlie added to Charlie identity");

    _aliceWallet = aliceWallet;
    _bobWallet = bobWallet;
    tokenContract = token;
    _tokenAgent = tokenAgent;
    _davidWallet = davidWallet;
    _charlieWallet = charlieWallet;
    ModularComplianceContract = modularComplianceImplementation
  });

  it("Should mint tokens once identity is verified via claim", async () => {
    await tokenContract.connect(tokenAgent).mint(aliceWallet.address, 1000);
    console.log("Token agent minted 1000 tokens to Alice");

    await tokenContract.connect(tokenAgent).mint(bobWallet.address, 500);
    console.log("Token agent minted 500 tokens to Bob");

    await tokenContract.connect(tokenAgent).mint(charlieWallet.address, 500);
    console.log("Token agent minted 500 tokens to charlie");

    expect(await tokenContract.balanceOf(aliceWallet.address)).to.equal(1000);
    expect(await tokenContract.balanceOf(bobWallet.address)).to.equal(500);
  });

  it("should not mint tokens if recipient identity not verified", async () => {
    await expect(
      tokenContract.connect(tokenAgent).mint(davidWallet.address, 100)
    ).to.be.revertedWith("Identity is not verified.");
  });

  it("transfer the tokens to random address", async () => {
    await tokenContract.connect(tokenAgent).unpause();
    await tokenContract.connect(aliceWallet).transfer(bobWallet.address, 10);
  });

  it("should not transfer tokens if recipient identity not verified", async () => {
    await expect(
      tokenContract.connect(aliceWallet).transfer(davidWallet.address, 10)
    ).to.be.revertedWith("receiver identity not verified");
  });

  it("should add new module", async () => {
    const CountryAllowModuleContract = await ethers.deployContract('CountryAllowModule');
    const proxy = await ethers.deployContract('ModuleProxy', [CountryAllowModuleContract.address, CountryAllowModuleContract.interface.encodeFunctionData('initialize')]);
    const countryAllowModule = await ethers.getContractAt('CountryAllowModule', proxy.address);
    await ModularComplianceContract.addModule(countryAllowModule.address);

    const modules = await ModularComplianceContract.getModules();
    expect(modules[0]).to.be.equal(countryAllowModule.address);
  })

  it("should add allowed country", async () => {
    const modules = await ModularComplianceContract.getModules();

    let ModularComplianceInterface = new ethers.utils.Interface(ModularComplianceABI);
    var txn_data =  ModularComplianceInterface.encodeFunctionData("addAllowedCountry", [42])
    await ModularComplianceContract.callModuleFunction(txn_data, modules[0]);

    var txn_data1 =  ModularComplianceInterface.encodeFunctionData("addAllowedCountry", [666])
    await ModularComplianceContract.callModuleFunction(txn_data1, modules[0]);
    
    const CountryAllowModuleContract = await ethers.getContractAt('CountryAllowModule', modules[0]);
    expect(await CountryAllowModuleContract.connect(deployer).isCountryAllowed((await ModularComplianceContract).address, 42)).to.be.true
    expect(await CountryAllowModuleContract.connect(deployer).isCountryAllowed((await ModularComplianceContract).address, 666)).to.be.true
    expect(await CountryAllowModuleContract.connect(deployer).isCountryAllowed((await ModularComplianceContract).address, 92)).to.be.false

  })

  it("should not transfer tokens if country not allowed", async () => {
    console.log("------")
    console.log("Balance before transfer")
    let prevAliceBalance = await tokenContract.balanceOf(_aliceWallet.address);
    console.log("Alice balance: ", prevAliceBalance.toNumber());
    let prevBobBalance = await tokenContract.balanceOf(_bobWallet.address);
    console.log("Bob balance: ", prevBobBalance.toNumber());
    let prevCharlieBalance = await tokenContract.balanceOf(_charlieWallet.address);
    console.log("Charlie balance: ", prevCharlieBalance.toNumber());

    await tokenContract.connect(_bobWallet).transfer(_aliceWallet.address, 10)

    await expect(tokenContract.connect(_aliceWallet).transfer(_charlieWallet.address, 10)).to.be.revertedWith("Transfer not possible");

    console.log("------")
    console.log("Balance after transfer")
    let postAliceBalance = await tokenContract.balanceOf(_aliceWallet.address);
    console.log("Alice balance: ", postAliceBalance.toNumber());
    let postBobBalance = await tokenContract.balanceOf(_bobWallet.address);
    console.log("Bob balance: ", postBobBalance.toNumber());
    let postCharlieBalance = await tokenContract.balanceOf(_charlieWallet.address);
    console.log("Charlie balance: ", postCharlieBalance.toNumber());

    expect(postAliceBalance.toNumber()).to.be.equal(prevAliceBalance.add(10).toNumber());
    expect(postBobBalance.toNumber()).to.be.equal(prevBobBalance.sub(10).toNumber());
    expect(postCharlieBalance.toNumber()).to.be.equal(prevCharlieBalance.toNumber());
  });

  it("should not mint token if breaks compliance rules", async()=>{
    const complianceModuleA = await ethers.deployContract('CountryAllowModule');
    await ModularComplianceContract.addModule(complianceModuleA.address);
    await tokenContract.setCompliance(ModularComplianceContract.address);

    await expect(
      tokenContract.connect(_tokenAgent).mint(_charlieWallet.address, 100)
    ).to.be.revertedWith("Compliance not followed")

    await expect(tokenContract.connect(_charlieWallet).transfer(_bobWallet.address, 10)).to.be.revertedWith(
      'Transfer not possible',
    );
  })

  it("should not transfer token if breaks compliance rules", async()=>{
    const complianceModuleA = await ethers.deployContract('CountryAllowModule');
    await ModularComplianceContract.addModule(complianceModuleA.address);
    await tokenContract.setCompliance(ModularComplianceContract.address);

    await expect(tokenContract.connect(_charlieWallet).transfer(_bobWallet.address, 10)).to.be.revertedWith(
      'Transfer not possible',
    );
  })
});
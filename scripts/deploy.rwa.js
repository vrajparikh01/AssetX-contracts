const { ethers } = require("hardhat");
const OnchainId = require("@onchain-id/solidity");

async function deployIdentityProxy(implementationAuthority, managementKey, signer) {
  const identity = await new ethers.ContractFactory(OnchainId.contracts.IdentityProxy.abi, OnchainId.contracts.IdentityProxy.bytecode, signer).deploy(
    implementationAuthority,
    managementKey,
  );

  return ethers.getContractAt('IIdentity', identity.address, signer);
}

async function deployFullSuite() {
  [deployer, tokenIssuer, tokenAgent, tokenAdmin, claimIssuer, aliceWallet, bobWallet, charlieWallet, davidWallet, anotherWallet] = await ethers.getSigners();
  const claimIssuerSigningKey = ethers.Wallet.createRandom();
  const aliceActionKey = ethers.Wallet.createRandom();
  console.log("Deploying contracts with the account:", deployer.address);

  const claimTopicsRegistryImplementation = await ethers.deployContract('ClaimTopicsRegistry', deployer);
  console.log("ClaimTopicsRegistry deployed to:", claimTopicsRegistryImplementation.address);

  const trustedIssuersRegistryImplementation = await ethers.deployContract('TrustedIssuersRegistry', deployer);
  console.log("TrustedIssuersRegistry deployed to:", trustedIssuersRegistryImplementation.address);

  const identityRegistryStorageImplementation = await ethers.deployContract('IdentityRegistryStorage', deployer);
  console.log("IdentityRegistryStorage deployed to:", identityRegistryStorageImplementation.address);

  const identityRegistryImplementation = await ethers.deployContract('IdentityRegistry', deployer);
  console.log("IdentityRegistry deployed to:", identityRegistryImplementation.address);

  const modularComplianceImplementation = await ethers.deployContract('ModularCompliance', deployer);
  console.log("ModularCompliance deployed to:", modularComplianceImplementation.address);
  modularComplianceImplementation.init()

  const tokenImplementation = await ethers.deployContract('Token', deployer);
  const identityImplementation = await new ethers.ContractFactory(
    OnchainId.contracts.Identity.abi,
    OnchainId.contracts.Identity.bytecode,
    deployer,
  ).deploy(deployer.address, true);
  console.log("Identity implementation deployed to:", tokenImplementation.address);

  const identityImplementationAuthority = await new ethers.ContractFactory(
    OnchainId.contracts.ImplementationAuthority.abi,
    OnchainId.contracts.ImplementationAuthority.bytecode,
    deployer,
  ).deploy(identityImplementation.address);
  console.log("Identity implementation authority deployed to:", identityImplementationAuthority.address);

  const identityFactory = await new ethers.ContractFactory(OnchainId.contracts.Factory.abi, OnchainId.contracts.Factory.bytecode, deployer).deploy(
    identityImplementationAuthority.address,
  );
  console.log("Identity factory deployed to:", identityFactory.address);

  const trexImplementationAuthority = await ethers.deployContract(
    'TREXImplementationAuthority',
    [true, ethers.constants.AddressZero, ethers.constants.AddressZero],
    deployer,
  );
  console.log("TREXImplementationAuthority deployed to:", trexImplementationAuthority.address);

  const versionStruct = {
    major: 4,
    minor: 0,
    patch: 0,
  };
  const contractsStruct = {
    tokenImplementation: tokenImplementation.address,
    ctrImplementation: claimTopicsRegistryImplementation.address,
    irImplementation: identityRegistryImplementation.address,
    irsImplementation: identityRegistryStorageImplementation.address,
    tirImplementation: trustedIssuersRegistryImplementation.address,
    mcImplementation: modularComplianceImplementation.address,
  };
  await trexImplementationAuthority.connect(deployer).addAndUseTREXVersion(versionStruct, contractsStruct);
  console.log("TREX version and contracts are added and used in TREXImplementationAuthority");

  const trexFactory = await ethers.deployContract('TREXFactory', [trexImplementationAuthority.address, identityFactory.address], deployer);
  await identityFactory.connect(deployer).addTokenFactory(trexFactory.address);
  console.log("TREXFactory deployed to:", trexFactory.address);

  const claimTopicsRegistry = await ethers
    .deployContract('ClaimTopicsRegistryProxy', [trexImplementationAuthority.address], deployer)
    .then(async (proxy) => ethers.getContractAt('ClaimTopicsRegistry', proxy.address));
  console.log("ClaimTopicsRegistry deployed to:", claimTopicsRegistry.address);

  const trustedIssuersRegistry = await ethers
    .deployContract('TrustedIssuersRegistryProxy', [trexImplementationAuthority.address], deployer)
    .then(async (proxy) => ethers.getContractAt('TrustedIssuersRegistry', proxy.address));
  console.log("TrustedIssuersRegistry deployed to:", trustedIssuersRegistry.address);

  const identityRegistryStorage = await ethers
    .deployContract('IdentityRegistryStorageProxy', [trexImplementationAuthority.address], deployer)
    .then(async (proxy) => ethers.getContractAt('IdentityRegistryStorage', proxy.address));
  console.log("IdentityRegistryStorage deployed to:", identityRegistryStorage.address);

  const defaultCompliance = await ethers.deployContract('DefaultCompliance', deployer);
  console.log("DefaultCompliance deployed to:", defaultCompliance.address);

  const identityRegistry = await ethers
    .deployContract(
      'IdentityRegistryProxy',
      [trexImplementationAuthority.address, trustedIssuersRegistry.address, claimTopicsRegistry.address, identityRegistryStorage.address],
      deployer,
    )
    .then(async (proxy) => ethers.getContractAt('IdentityRegistry', proxy.address));
  console.log("IdentityRegistry deployed to:", identityRegistry.address);

  const tokenOID = await deployIdentityProxy(identityImplementationAuthority.address, tokenIssuer.address, deployer);
  const tokenName = 'TREXDINO';
  const tokenSymbol = 'TREX';
  const tokenDecimals = 18;
  const token = await ethers
    .deployContract(
      'TokenProxy',
      [
        trexImplementationAuthority.address,
        identityRegistry.address,
        modularComplianceImplementation.address,
        tokenName,
        tokenSymbol,
        tokenDecimals,
        tokenOID.address,
      ],
      deployer,
    )
    .then(async (proxy) => ethers.getContractAt('Token', proxy.address));
  console.log("RWA Token deployed to:", token.address);

  const agentManager = await ethers.deployContract('AgentManager', [token.address], tokenAgent);
  console.log("AgentManager deployed to:", agentManager.address);

  const claimIssuerContract = await ethers.deployContract('ClaimIssuerDexReal', [claimIssuer.address], claimIssuer);
  console.log("ClaimIssuer deployed to:", claimIssuerContract.address);

  return {
    accounts: {
      deployer,
      tokenIssuer,
      tokenAgent,
      tokenAdmin,
      claimIssuer,
      claimIssuerSigningKey,
      aliceActionKey,
      aliceWallet,
      bobWallet,
      charlieWallet,
      davidWallet,
      anotherWallet,
    },
    suite: {
      claimIssuerContract,
      claimTopicsRegistry,
      trustedIssuersRegistry,
      identityRegistryStorage,
      defaultCompliance,
      identityRegistry,
      tokenOID,
      token,
      agentManager,
    },
    authorities: {
      trexImplementationAuthority,
      identityImplementationAuthority,
    },
    factories: {
      trexFactory,
      identityFactory,
    },
    implementations: {
      identityImplementation,
      claimTopicsRegistryImplementation,
      trustedIssuersRegistryImplementation,
      identityRegistryStorageImplementation,
      identityRegistryImplementation,
      modularComplianceImplementation,
      tokenImplementation,
    },
  };
}

async function deployComplianceFixture() {
  const [deployer, aliceWallet, bobWallet, anotherWallet] = await ethers.getSigners();

  const compliance = await ethers.deployContract('ModularCompliance');
  await compliance.init();

  return {
    accounts: {
      deployer,
      aliceWallet,
      bobWallet,
      anotherWallet,
    },
    suite: {
      compliance,
    },
  };
}

// deployFullSuite().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });

module.exports = {
  deployIdentityProxy,
  deployFullSuite,
  deployComplianceFixture,
}

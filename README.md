# AssetX Contracts

AssetX is the RWA Launchpad, enabling compliant tokenization, trading, and investment in real-world assets (RWAs).  
This repository contains the **smart contracts** powering the AssetX ecosystem.

To see the detailed functionality documentation, visit the [AssetX Docs](https://docs.google.com/document/d/1p2uinBX4mU_k44AfnWcFjAXly7GI5CZvJKVJ3tusEYo/edit?usp=sharing).

---

## 📌 Overview

The contracts implement:
- **RWA Wrapping** – Wrap real-world assets into compliant ERC20 tokens (ERC-3643-based).
- **Liquidity Pools** – Create and trade custom pairs (WERC20 <> USDC).
- **Compliance Modules** – Pluggable KYC/AML, country restrictions, and supply/transfer limits.
- **Custodian Layer** – Binding on-chain tokens to off-chain custodial receipts.

---

## ⚙️ Tech Stack

- Solidity (smart contracts)
- Hardhat (development & deployment)
- ERC-20 + ERC-3643 extensions
- Upgradeable Proxy pattern
- OpenZeppelin libraries
- Uniswap V2 fork for DEX functionality

---

## 📂 Contracts

- `Launchpad.sol` – Main launchpad contract for RWA tokenization
- `Token.sol` - Base ERC3643 RWA token contract standard 
- `STOFactory.sol` – Factory for creating wrapped RWA tokens
- `UniswapV2Factory.sol` – Factory for liquidity pairs
- `UniswapV2Pair.sol` – Liquidity pair contract  
- `UniswapV2Router02.sol` – Router for swaps and liquidity   
- `Compliance/` – Modular and legal compliance contracts  

---

## 🚀 Getting Started

### 1️⃣ Clone Repository
```bash
git clone https://github.com/vrajparikh01/AssetX-contracts.git
cd AssetX-contracts
```

### 2️⃣ Install Dependencies
``` bash 
npm install
```

### 3️⃣ Compile Contracts
``` bash
npx hardhat compile
```

### 4️⃣ Run Tests
```bash
npx hardhat test
```

### 5️⃣ Deploy Locally
```bash
npx hardhat node
```
In a new terminal, run:
```bash
npx hardhat run scripts/deploy.launchpad.js --network localhost
```

### 6️⃣ Deploy to Testnet
We have deployed contracts on Mantle Sepolia and Arbitrum Sepolia testnets.
```bash
npx hardhat run scripts/deploy.stofactory.js --network mantle_sepolia
npx hardhat run scripts/deploy.stofactory.js --network arbitrum_sepolia
```

## 🔒 Compliance & Security

### *Legacy Compliance Modules*
- ApproveTransfer.sol - Transfer approval mechanisms
- CountryRestrictions.sol - Geographic restrictions
- DayMonthLimits.sol - Time-based transfer limits
- MaxBalance.sol - Wallet balance limitations
- SupplyLimit.sol - Token supply management

### *Modular Compliance System*
- ConditionalTransferModule.sol - Smart transfer conditions
- CountryAllowModule.sol - Whitelist management
- ExchangeMonthlyLimitsModule.sol - Exchange restrictions
- TransferFeesModule.sol - Dynamic fee structures


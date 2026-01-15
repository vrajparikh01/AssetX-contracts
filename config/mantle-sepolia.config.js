require("dotenv").config({ path: __dirname + "/./../.env" });
module.exports = {
    "RPC_URL":process.env.MANTLE_SEPOLIA_RPC_URL,
    "NETWORK":process.env.NETWORK,
    "SCAN_API_KEY":process.env.MANTLE_SEPOLIA_API_KEY,
    "ACCOUNT_PRIVATE_KEY":process.env.MANTLE_SEPOLIA_ACCOUNT_PRIVATE_KEY,
    "OPTIMIZER_RUNS":process.env.MANTLE_SEPOLIA_OPTIMIZER_RUNS,
    "OPTIMIZER_FLAG":process.env.MANTLE_SEPOLIA_OPTIMIZER_FLAG,
}
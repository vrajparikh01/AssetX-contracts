require("dotenv").config({ path: __dirname + "/./../.env" });
module.exports = {
    "RPC_URL":process.env.BASE_MAINNET_RPC_URL,
    "NETWORK":process.env.NETWORK,
    "SCAN_API_KEY":process.env.BASE_MAINNET_API_KEY,
    "ACCOUNT_PRIVATE_KEY":process.env.BASE_MAINNET_ACCOUNT_PRIVATE_KEY,
    "OPTIMIZER_RUNS":process.env.BASE_MAINNET_OPTIMIZER_RUNS,
    "OPTIMIZER_FLAG":process.env.BASE_MAINNET_OPTIMIZER_FLAG,
}
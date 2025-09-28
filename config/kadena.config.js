require("dotenv").config({ path: __dirname + "/./../.env" });
module.exports = {
    "RPC_URL":process.env.KADENA_RPC_URL,
    "NETWORK":process.env.NETWORK,
    "SCAN_API_KEY":process.env.KADENA_API_KEY,
    "ACCOUNT_PRIVATE_KEY":process.env.KADENA_ACCOUNT_PRIVATE_KEY,
    "OPTIMIZER_RUNS":process.env.KADENA_OPTIMIZER_RUNS,
    "OPTIMIZER_FLAG":process.env.KADENA_OPTIMIZER_FLAG,
}
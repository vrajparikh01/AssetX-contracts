// While testing/deploying on different networks it will be easy. 
// Just change the NETWORK variable in .env file and the configuration will be picked up from the respective file.
require("dotenv").config({ path: __dirname + "/./../.env" });

const SEPOLIA_CONFIG = require("./sepolia.config");
const MAINNET_CONFIG = require("./mainnet.config");
const BASE_MAINNET_CONFIG = require("./base.config");
const KADENA_CONFIG = require("./kadena.config");

let EXPORT_CONFIG;

if(process.env.NETWORK == "mainnet"){
    EXPORT_CONFIG = MAINNET_CONFIG;
}
else if(process.env.NETWORK == "sepolia"){
    EXPORT_CONFIG = SEPOLIA_CONFIG;
}
else if(process.env.NETWORK == "base"){
    EXPORT_CONFIG = BASE_MAINNET_CONFIG;
}
else if(process.env.NETWORK == "kadena"){
    EXPORT_CONFIG = KADENA_CONFIG;
}
else{
    EXPORT_CONFIG = {
        "ACCOUNT_PRIVATE_KEY":process.env.ACCOUNT_PRIVATE_KEY,
        "OPTIMIZER_RUNS":process.env.OPTIMIZER_RUNS,
        "OPTIMIZER_FLAG":process.env.OPTIMIZER_FLAG
    };
}

module.exports = EXPORT_CONFIG;
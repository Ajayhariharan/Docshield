const path = require("path");

module.exports = {
  contracts_directory: "./smart_contracts",
  contracts_build_directory: "./smart_contracts/build",
  networks: {
    development: {
      host: "127.0.0.1",     // Ganache
      port: 7545,            // default Ganache port
      network_id: "*"        // match any network
    }
  },
  compilers: {
    solc: {
      version: "0.8.0"
    }
  }
};

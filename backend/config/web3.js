const Web3 = require('web3');
const contractABI = require('../smart_contracts/build/DocShield.json').abi;
const contractAddress = process.env.CONTRACT_ADDRESS;

const web3 = new Web3(process.env.WEB3_PROVIDER || 'http://127.0.0.1:7545');
const contract = new web3.eth.Contract(contractABI, contractAddress);

module.exports = { web3, contract };

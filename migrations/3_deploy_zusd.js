const Web3EthAbi = require('web3-eth-abi');
const ZUSD = artifacts.require('ZUSD');
const Token = artifacts.require('Token_v1');


module.exports = function(deployer) {
    const config = require(`../config/${deployer.network}.json`);

    const [initializeAbi] = Token.abi.filter((f) => f.name === 'initialize');

    const name = config.production ? 'Z.com USD' : `Z.com USD${config.name_suffix}`;
    const symbol = config.production ? 'ZUSD' : `ZUSD${config.symbol_suffix}`;
    const decimals = 6;
    const { owner, admin, capper, prohibiter, pauser, minterAdmin, minter } = config;

    deployer
        .then(() => Token.deployed())
        .then(token => deployer.deploy(ZUSD, token.address, config.deployer, Web3EthAbi.encodeFunctionCall(initializeAbi, [name, symbol, decimals, owner, admin, capper, prohibiter, pauser, minterAdmin, minter])));
};
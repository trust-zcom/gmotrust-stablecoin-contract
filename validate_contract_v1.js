/*
 * NOTE: Can not execute this script with deployer address!
 */

// Name of current implementation artifact as stored in ./build/contracts/*.json
const TokenV1 = artifacts.require("Token_v1");

// Name of current proxy artifact as stored in ./build/contracts/*.json
const GYEN = artifacts.require("GYEN");
const ZUSD = artifacts.require("ZUSD");

const adminSlot =
  "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";
const implSlot =
  "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

const asyncGetStorageAt = (address, slot) =>
  new Promise((resolve, reject) => {
    web3.eth.getStorageAt(address, slot, (err, result) => {
      if (err) {
        return reject(err);
      }
      resolve(result);
    });
  });

function getAddressFromSlotData(slotData) {
  const rawAddress = slotData.substring(26, 86);
  return "0x" + rawAddress;
}

async function getInfos(proxiedToken) {

  const name = await proxiedToken.name.call();
  console.log(`name:              ${name}`); 
  const symbol = await proxiedToken.symbol.call();
  console.log(`symbol:            ${symbol}`);

  let decimals = await proxiedToken.decimals.call();
  decimals = decimals.toNumber();
  console.log(`decimals:          ${decimals}`);

  let totalSupply = await proxiedToken.totalSupply.call();
  totalSupply = totalSupply.toString(); 
  console.log(`totalSupply:       ${totalSupply}`);

  let capacity = await proxiedToken.capacity.call();
  capacity = capacity.toString();
  console.log(`capacity:          ${capacity}`);

  const paused = await proxiedToken.paused.call();
  console.log(`paused:            ${paused}`);

  // implementation
  let implementation = await asyncGetStorageAt(
    proxiedToken.address,
    implSlot
  );
  implementation = getAddressFromSlotData(implementation);
  console.log(`implementation:    ${implementation}`);

  let deployer = await asyncGetStorageAt(proxiedToken.address, adminSlot);
  deployer = getAddressFromSlotData(deployer);
  console.log(`deployer:          ${deployer}`);

  const owner = await proxiedToken.owner.call();
  console.log(`owner:             ${owner}`);

  const admin = await proxiedToken.admin.call();
  console.log(`admin:             ${admin}`);

  const minterAdmin = await proxiedToken.minterAdmin.call();
  console.log(`minterAdmin:       ${minterAdmin}`);

  const capper = await proxiedToken.capper.call();
  console.log(`capper:            ${capper}`);

  const prohibiter = await proxiedToken.prohibiter.call();
  console.log(`prohibiter:        ${prohibiter}`);

  const pauser = await proxiedToken.pauser.call();
  console.log(`pauser:            ${pauser}`);

  const minter = await proxiedToken.minter.call();
  console.log(`minter:            ${minter}`);
}


async function Validate() {
  console.log("Connecting to Token_v1 contract...");
  const token = await TokenV1.deployed();
  await TokenV1.at(token.address);
  console.log("Token_v1 found.");

  console.log("\n");

  const zusd = await ZUSD.deployed();
  let proxiedToken = await TokenV1.at(zusd.address);
  console.log("****** ZUSD ******");
  let proxyAddress = proxiedToken.address;
  console.log(`zusd contract:     ${proxyAddress}`);
  await getInfos(proxiedToken);

  console.log("\n");
 
  const gyen = await GYEN.deployed();
  proxiedToken = await TokenV1.at(gyen.address);
  console.log("****** GYEN ******");
  proxyAddress = proxiedToken.address;
  console.log(`gyen contract:     ${proxyAddress}`);
  await getInfos(proxiedToken);

}

module.exports = async (callback) => {
  try {
    await Validate();
  } catch (e) {
    console.log(e);
  }
  callback();
};

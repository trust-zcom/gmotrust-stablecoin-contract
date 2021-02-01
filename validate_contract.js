/*
 * NOTE: Can not execute this script with deployer address!
 */
const BN = require("bn.js");

// Name of current implementation artifact as stored in ./build/contracts/*.json
const TokenV1 = artifacts.require("Token_v1");
const TokenV2 = artifacts.require("Token_v2");

// Name of current proxy artifact as stored in ./build/contracts/*.json
const GYEN = artifacts.require("GYEN");
const ZUSD = artifacts.require("ZUSD");

let proxiedToken;
let contractAddress;

async function main(flag, version) {

  let proxy;
  if(flag == 1){
    proxy = await GYEN.deployed();
  }else{
    proxy = await ZUSD.deployed();
  }
  
  contractAddress = proxy.address;
  if(version == "1"){
    proxiedToken = await TokenV1.at(contractAddress);
  }else if(version == "2"){
    proxiedToken = await TokenV2.at(contractAddress); 
  }
  
  console.log("Token Proxy Address => ", contractAddress);

  let slots = [];
  let value;

  for (index = 0; index < 70; index++){
    value = await readSlot(contractAddress, index);
    slots[index] = value;
  }

  // print slots infor
  printinfos(slots);

  // print basis infor
  await printBasis(slots, version);

  // print balance values
  await printBalances(slots);

  // print allawance values
  await printAllwances(slots);

  // print prohibited values
  await printProhibiteds(slots);


}

function printinfos(slots) {
  console.log("\n\nSlots Information:\n");

  for (let i = 0; i < slots.length; i++) {
    var tmp = '' + i;
    tmp = tmp.padStart(2, "0");

    tmp = "slots[ " + tmp + " ] :  ";
    tmp += slots[i];

    console.log(tmp);

  }
} 

async function printBasis(slots, version) {

  const adminSlot =
  "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";
  const implSlot =
  "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";


  console.log("\n\nBasis Information:\n");

  // slot 53 - uint256 private _totalSupply
  let totolSupply = parseUint(slots[53]).toString();
  console.log(`totolSupply:           ${totolSupply/1e6}  (${totolSupply})`); 


  // slot 54 - capicity
  let capicity = parseUint(slots[54]).toString();
  console.log(`capicity:              ${capicity/1e6}  (${capicity})`); 
    
  // slot 55 - capper 
  let capper = parseAddress(slots[55].slice(-40));
  console.log(`capper:                ${capper}`); 

  // slot 56 - pauser, paused
  let paused = parseInt(slots[56].slice(-42, -40), 16);
  console.log(`paused:                ${paused}`); 
  let pauser = parseAddress(slots[56].slice(-40));
  console.log(`pauser:                ${pauser}`); 
    
  // slot 57 - prohibiter 
  let prohibiter = parseAddress(slots[57].slice(-40));
  console.log(`prohibiter:            ${prohibiter}`);         
  

  // slot 59 - admin 
  let admin = parseAddress(slots[59].slice(-40));
  console.log(`admin:                 ${admin}`); 

  // slot 60 - minter 
  let minter = parseAddress(slots[60].slice(-40));
  console.log(`minter:                ${minter}`); 

  // slot 61 - minterAdmin 
  let minterAdmin = parseAddress(slots[61].slice(-40));
  console.log(`minterAdmin:           ${minterAdmin}`); 
    
  // slot 62 - owner 
  let owner = parseAddress(slots[62].slice(-40));    
  console.log(`owner:                 ${owner}`);  

  // slot 63 - name
  let name = parseString(slots[63]);
  console.log(`name:                  ${name}`); 

  // slot 64 - symbol
  let symbol = parseString(slots[64]);
  console.log(`symbol:                ${symbol}`); 

  if(version == "1"){
    // slot 65 - decimals
    let decimals = parseUint(slots[65].slice(-2)).toNumber();
    console.log(`decimals:              ${decimals}`); 
  }else if(version == "2"){
    // slot 65 - decimals, wiper
    let decimals = parseUint(slots[65].slice(-2)).toNumber();
    console.log(`decimals:              ${decimals}`); 

    let wiper = parseAddress(slots[65].slice(-42,-2));
    console.log(`wiper:                 ${wiper}`); 
  }

  // deployer
  let deployer = await readSlot(contractAddress, adminSlot);
  console.log(`deployer:              ${parseAddress(deployer.slice(-40))}`);

  // implementation
  let implementation = await readSlot(contractAddress, implSlot);
  console.log(`implementation:        ${parseAddress(implementation.slice(-40))}`);

} 



// slot 51 - mapping (address => uint256) private _balances
async function printBalances(slots){

  //event Transfer(address indexed from, address indexed to, uint256 value);
  const transfers = await proxiedToken.getPastEvents('Transfer', {
    fromBlock: 0,
    toBlock: 'latest'
  });

  const pastHolders = [];
  const pastHolderBalanceGets = [];

  transfers.forEach((transfer, i) => {
    const address = transfer.returnValues.to;

    if (pastHolders.indexOf(address) > -1) return;

    pastHolders.push(address);
    pastHolderBalanceGets.push(proxiedToken.balanceOf(address));
  });

  const balances = await Promise.all(pastHolderBalanceGets);
  const holders = [];

  balances.forEach((balance, i) => {
    if (balance > 0) {
      holders.push({
        address: pastHolders[i],
        balance: parseFloat(balance / 1e6).toFixed(6)
      });
    }
  });

  holders.sort((a,b) => {
    return parseFloat(a.balance) < parseFloat(b.balance) ? 1 : -1;
  });  

  console.log("\n\nBalances Information:  ",holders.length);
  console.log(holders);

}

// slot 52 - mapping (address => mapping (address => uint256)) private _allowances
async function printAllwances(slots){

  // event Approval(address indexed owner, address indexed spender, uint256 value);
  const approves = await proxiedToken.getPastEvents('Approval', {
    fromBlock: 0,
    toBlock: 'latest'
  });

  const ownerspender = [];
  const allowancesTmp = [];

  approves.forEach((approve, i) => {

    const owneraddress = approve.returnValues.owner;
    const spenderaddress = approve.returnValues.spender;
    const tmp = "" + owneraddress + spenderaddress;

    if (ownerspender.indexOf(tmp) > -1) return;

    ownerspender.push(tmp);
    
    allowancesTmp.push(proxiedToken.allowance(owneraddress, spenderaddress));
    
    
  });

  const allowances = await Promise.all(allowancesTmp);
  const allowancedata = [];

  allowances.forEach((allowance, i) => {
    const tmp = parseInt(allowance.toString());

    if (tmp > 0) {
      allowancedata.push({
        owner: ownerspender[i].slice(0,42),
        spender: ownerspender[i].slice(-42),
        allowance: parseFloat(tmp / 1e6).toFixed(6)
      });
    }
  });

  allowancedata.sort((a,b) => {
    return parseFloat(a.allowance) < parseFloat(b.allowance) ? 1 : -1;
  });  

  console.log("\n\nAllowances Information:  ", allowancedata.length);
  console.log(allowancedata);

}

// slot 58 - mapping(address => bool) public prohibiteds
async function printProhibiteds(slots){

  //event Prohibition(address indexed prohibited, bool status, address indexed sender);
  const prohibiteds = await proxiedToken.getPastEvents('Prohibition', {
    fromBlock: 0,
    toBlock: 'latest'
  });

  const prohibitedResutTmp = [];
  const prohibitedData = [];

  prohibiteds.forEach((prohibited, i) => {

    const address = prohibited.returnValues.prohibited;

    if (prohibitedData.indexOf(address) > -1) return;

    prohibitedData.push(address);
    
    prohibitedResutTmp.push(proxiedToken.prohibiteds(address));

  }); 

  const prohibitedResuts = await Promise.all(prohibitedResutTmp);
  const prohibitesout = [];

  prohibitedResuts.forEach((prohibitedResut, i) => {

    if (prohibitedResut) {
      prohibitesout.push({
        address: prohibitedData[i],
        prohibited: prohibitedResut 
      });
    }
  });

  console.log("\n\nProhibitions Information: ", prohibitesout.length);
  console.log(prohibitesout);

}


function parseAddress(hex) {
  return web3.utils.toChecksumAddress(hex.padStart(40, "0"));
}

function parseString(hex) {
  const len = parseInt(hex.slice(-2), 16);
  return Buffer.from(hex.slice(0, len), "hex").toString("utf8");
}

function parseUint(hex) {
  return new BN(hex, 16);
}
  
function encodeUint(value) {
  let re = new BN(value).toString(16).padStart(64, "0");
  return re;
}

function encodeAddress(addr) {
  return addr.replace(/^0x/, "").toLowerCase().padStart(64, "0");
}

function addressMappingSlot(addr, pos) {
  return web3.utils.keccak256("0x" + encodeAddress(addr) + encodeUint(pos));
}

function address2MappingSlot(addr, addr2, pos) {
  return web3.utils.keccak256(
    "0x" + encodeAddress(addr2) + addressMappingSlot(addr, pos).slice(2)
  );
}
  
async function readSlot(
  address,
  slot
){
  const data = await web3.eth.getStorageAt(
    address,
    slot
  );
  return data.replace(/^0x/, "");
}
  
function increaseHexByOne(hex) {
  let x = new BN(hex, 16);
  let sum = x.add(new BN(1, 10));
  let result = '0x' + sum.toString(16)
  return result
}

module.exports = async (callback) => {
  try {

    console.log("=== GYEN Storage DATA V" + process.argv[4] + " === \n");
    await main(1, process.argv[4]);

    console.log("\n\n------------------------------------------------------------\n");
    console.log("=== ZUSD Storage DATA V" + process.argv[4] + " === \n");
    await main(2, process.argv[4]);

  } catch (e) {
    console.log(e);
  }
  callback();
};

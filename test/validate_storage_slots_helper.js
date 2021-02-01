const BN = require("bn.js");

const Token_V1 = artifacts.require("Token_v1");
const Token_V2 = artifacts.require("Token_v2");

const truffleAssert = require('truffle-assertions');
const Web3EthAbi = require('web3-eth-abi');

const abiv1 = require("../build/contracts/Token_v1.json").abi;
const abiv2 = require("../build/contracts/Token_v2.json").abi;
const [initializeAbi] = abiv1.filter((f) => f.name === 'initialize');
const [initializeWiperAbi] = abiv2.filter((f) => f.name === 'initializeWiper');

const adminSlot =
  "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";
const implSlot =
  "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

module.exports = validateStorageSlots;

function validateStorageSlots(
    Proxy,
    version,
    accounts
  ){

    describe("uses original storage slot positions", () => {

      let tokenInstance;
      let gyenInstance;
      let owner = accounts[0];
      let admin = accounts[1];
      let capper = accounts[2];
      let prohibiter = accounts[3];
      let pauser = accounts[4];
      let minterAdmin = accounts[5];
      let minter = accounts[6];
      let proxyAdmin = accounts[7];
      let wiper = accounts[8];
      let alice = accounts[9];
      let bob = accounts[10]; 
      let charlie = accounts[11];
      let newProxyAdmin = accounts[12]; 


      const [name, symbol, decimals] = ["GMO stable coin", "SYMBOL", 6];
      const [capped, minted, transferred, allowance] = [
        1000e6,
        200e6,
        30e6,
        40e6,
      ];

      let gyenProxy;

      beforeEach(async () => {

        let data = Web3EthAbi.encodeFunctionCall(initializeAbi, [name, symbol, decimals, owner, admin, capper, prohibiter, pauser, minterAdmin, minter]);
        tokenInstance = await Token_V1.new();
        
        gyenProxy = await Proxy.new(tokenInstance.address, proxyAdmin, data);
        gyenInstance = await Token_V1.at(gyenProxy.address);
    
        await gyenInstance.cap(capped, {from: capper});
        await gyenInstance.mint(alice, minted, { from: minter });
        await gyenInstance.transfer(bob, transferred, { from: alice });
        await gyenInstance.approve(charlie, allowance, { from: alice });
        await gyenInstance.prohibit(charlie, { from: prohibiter });
        await gyenInstance.pause({ from: pauser });

        if (version > 1) {

            tokenInstance = await Token_V2.new();
            let datav2 = Web3EthAbi.encodeFunctionCall(initializeWiperAbi,[wiper]);
            // upgrade 
            await gyenProxy.upgradeToAndCall(tokenInstance.address, datav2, { from: proxyAdmin });
            // change deplooyer
            await gyenProxy.changeAdmin(newProxyAdmin, { from: proxyAdmin });

        }

      });

      it("retains original storage slots 0 through 65", async () => {


        let slots = [];
        for (let i = 0; i < 66; i++) {
          slots[i] = await readSlot(gyenProxy.address, i);
        }
  
        //read the slots data
        /*
        console.log("slots info\n"); 
        for (let i = 0; i < slots.length; i++) {
            var tmp = "slots[ " + i + " ] : ";
            tmp += slots[i];
            console.log(tmp);
        }
        */

      // slot 51 - mapping (address => uint256) private _balances;
      expect(slots[51]).to.equal("0");

      // slot 52 - mapping (address => mapping (address => uint256)) private _allowances;
      expect(slots[52]).to.equal("0");

      // slot 53 - uint256 private _totalSupply
      expect(parseUint(slots[53]).toNumber()).to.equal(minted);

      // slot 54 - capicity
      expect(parseUint(slots[54]).toNumber()).to.equal(capped);  
      
      // slot 55 - capper 
      expect(parseAddress(slots[55])).to.equal(capper);

      // slot 56 - pauser, paused
      // values are lower-order aligned
      expect(parseInt(slots[56].slice(0, 2), 16)).to.equal(1); // paused
      expect(parseAddress(slots[56].slice(2))).to.equal(pauser); // pause
      
      // slot 57 - prohibiter 
      expect(parseAddress(slots[57])).to.equal(prohibiter); 
            
      // slot 58 - mapping(address => bool) public prohibiteds
      expect(slots[58]).to.equal("0");

      // slot 59 - admin 
      expect(parseAddress(slots[59])).to.equal(admin);       

      // slot 60 - minter 
      expect(parseAddress(slots[60])).to.equal(minter); 

      // slot 61 - minterAdmin 
      expect(parseAddress(slots[61])).to.equal(minterAdmin);
      
      // slot 62 - owner 
      expect(parseAddress(slots[62])).to.equal(owner);       

      // slot 63 - name
      expect(parseString(slots[63])).to.equal(name);

      // slot 64 - symbol
      expect(parseString(slots[64])).to.equal(symbol);

      
      if (version > 1) {

        // slot 65 - decimals, wiper
        expect(parseUint(slots[65].slice(-2)).toNumber()).to.equal(decimals);
        expect(parseAddress(slots[65].slice(0,-2))).to.equal(wiper); 
        //console.log("wiper: ", slots[65].slice(0,-2));      
      }else if(version == 1){
        // slot 65 - decimals
        expect(parseUint(slots[65]).toNumber()).to.equal(decimals);
      }

      // proxy admin
      let deployer = await readSlot(gyenProxy.address, adminSlot);
      if (version > 1) {
        expect(deployer).to.equal(newProxyAdmin.toLowerCase().slice(2));
      }else if(version == 1){
        expect(deployer).to.equal(proxyAdmin.toLowerCase().slice(2));
      }
      
      // implementation
      let implementation = await readSlot(gyenProxy.address, implSlot);
    
      expect(implementation).to.equal(tokenInstance.address.toLowerCase().slice(2));
      });
  
      // slot 51 - mapping (address => uint256) private _balances; 
      it("retains original storage slots for balances mapping", async () => {
        // balance[alice]
        let v = parseInt(
          await readSlot(gyenProxy.address, addressMappingSlot(alice, 51)),
          16
        );
        expect(v).to.equal(minted - transferred);
  
        // balances[bob]
        v = parseInt(
          await readSlot(gyenProxy.address, addressMappingSlot(bob, 51)),
          16
        );
        expect(v).to.equal(transferred);
      });
  
      // slot 52 - mapping (address => mapping (address => uint256)) private _allowances; 
      it("retains original storage slots for allowed mapping", async () => {
        // allowed[alice][bob]
        let v = parseInt(
          await readSlot(gyenProxy.address, address2MappingSlot(alice, bob, 52)),
          16
        );
        expect(v).to.equal(0);
        // allowed[alice][charlie]
        v = parseInt(
          await readSlot(gyenProxy.address, address2MappingSlot(alice, charlie, 52)),
          16
        );
        expect(v).to.equal(allowance);
      });
  
      // slot 58 - mapping(address => bool) public prohibiteds
      it("retains original storage slots for prohibiteds mapping", async () => {
        // prohibiteds[alice]
        let v = parseInt(
          await readSlot(gyenProxy.address, addressMappingSlot(alice, 58)),
          16
        );
        expect(v).to.equal(0);
  
        // prohibiteds[charlie]
        v = parseInt(
          await readSlot(gyenProxy.address, addressMappingSlot(charlie, 58)),
          16
        );
        expect(v).to.equal(1);
      });
    });
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
    //console.log("encodeUint = ",re);
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
  
  // read slots data without '0x'
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
  
  // increase hex address
  function increaseHexByOne(hex) {
    let x = new BN(hex, 16);
    let sum = x.add(new BN(1, 10));
    let result = '0x' + sum.toString(16)
    return result
  }
  
  
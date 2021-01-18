
//modified 2020/08/24 start
//const Token = artifacts.require("Token_v1");
const Token = artifacts.require("Token_v2");
//modified 2020/08/24 end;
const truffleAssert = require('truffle-assertions');

contract("Prohibiter.sol", (accounts) => {
  let contractInstance;
  let owner = accounts[0];
  let admin = accounts[1];
  let capper = accounts[2];
  let prohibiter = accounts[3];
  let pauser = accounts[4];
  let minterAdmin = accounts[5];
  let minter = accounts[6];
  let zero_address = '0x0000000000000000000000000000000000000000'

  var initialize =  async () => {
    contractInstance = await Token.new();
    await contractInstance.initialize('A', 'a', 1, owner, admin, capper, prohibiter, pauser, minterAdmin, minter);
  }

  describe('Test prohibit function', function() {
    beforeEach(initialize);
    
    it("prohibiter can prohibit the account", async () => {
      let prohibit_account =  accounts[11];
      let prohibit_tx = await contractInstance.prohibit(prohibit_account, {from: prohibiter});
      await truffleAssert.eventEmitted(prohibit_tx, 'Prohibition', {prohibited: prohibit_account, status: true, sender: prohibiter}, 'Prohibition event should be emitted with correct parameters');
    });

    it("non prohibiter cannot prohibit the account", async () => {
      let non_prohibiter = accounts[11];
      let prohibit_account =  accounts[12];
      await truffleAssert.reverts(
        contractInstance.prohibit(prohibit_account, {from: non_prohibiter}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
    
    it("paused contract cannot prohibit account", async () => {
      let prohibit_account =  accounts[11];
      await contractInstance.pause({from: pauser});
      await truffleAssert.reverts(
        contractInstance.prohibit(prohibit_account, {from: prohibiter}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );      
    });

    it("prohibited account cannot prohibit again", async () => {
      let prohibit_account = accounts[11];
      await contractInstance.prohibit(prohibit_account, {from: prohibiter});
      await truffleAssert.reverts(
        contractInstance.prohibit(prohibit_account, {from: prohibiter}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("prohibited account cannot be zero", async () => {
      await truffleAssert.reverts(
        contractInstance.prohibit(zero_address, {from: prohibiter}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });

  describe('Test unprohibit function', function() {
    beforeEach(initialize);
    
    it("prohibiter can unprohibit the account", async () => {
      let prohibit_account =  accounts[11];
      await contractInstance.prohibit(prohibit_account, {from: prohibiter});
      let unprohibit_tx = await contractInstance.unprohibit(prohibit_account, {from: prohibiter});
      await truffleAssert.eventEmitted(unprohibit_tx, 'Prohibition', {prohibited: prohibit_account, status: false, sender: prohibiter}, 'Prohibition event should be emitted with correct parameters');
    });

    it("non prohibiter cannot unprohibit the account", async () => {
      let non_prohibiter = accounts[11];
      let prohibit_account =  accounts[12];
      await contractInstance.prohibit(prohibit_account, {from: prohibiter});
      await truffleAssert.reverts(
        contractInstance.unprohibit(prohibit_account, {from: non_prohibiter}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
    
    it("paused contract cannot unprohibit account", async () => {
      let prohibit_account =  accounts[11];
      await contractInstance.prohibit(prohibit_account, {from: prohibiter});
      await contractInstance.pause({from: pauser});
      await truffleAssert.reverts(
        contractInstance.unprohibit(prohibit_account, {from: prohibiter}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );      
    });

    it("non prohibited account cannot unprohibit", async () => {
      let prohibit_account = accounts[11];
      await truffleAssert.reverts(
        contractInstance.unprohibit(prohibit_account, {from: prohibiter}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("unprohibit account cannot be zero", async () => {
      await truffleAssert.reverts(
        contractInstance.unprohibit(zero_address, {from: prohibiter}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });
})
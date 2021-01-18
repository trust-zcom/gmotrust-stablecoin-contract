
//modified 2020/08/24 start
//const Token = artifacts.require("Token_v1");
const Token = artifacts.require("Token_v2");
//modified 2020/08/24 end;
const truffleAssert = require('truffle-assertions');

contract("Pauser.sol", (accounts) => {
  let contractInstance;
  let owner = accounts[0];
  let admin = accounts[1];
  let capper = accounts[2];
  let prohibiter = accounts[3];
  let pauser = accounts[4];
  let minterAdmin = accounts[5];
  let minter = accounts[6];

  var initialize =  async () => {
    contractInstance = await Token.new();
    await contractInstance.initialize('A', 'a', 1, owner, admin, capper, prohibiter, pauser, minterAdmin, minter);
  }

  describe('Test pause function', function() {
    beforeEach(initialize);
    
    it("pauser can pause the contract", async () => {
      let pause_tx = await contractInstance.pause({from: pauser});
      await truffleAssert.eventEmitted(pause_tx, 'Pause', {status: true, sender: pauser}, 'Pause event should be emitted with correct parameters');
    });

    it("non pauser cannot pause the contract", async () => {
      let non_pauser = accounts[11];
      await truffleAssert.reverts(
        contractInstance.pause({from: non_pauser}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
    
    it("paused contract cannot pause again", async () => {
      await contractInstance.pause({from: pauser});
      await truffleAssert.reverts(
        contractInstance.pause({from: pauser}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );      
    });
  });

  describe('Test unpause function', function() {
    beforeEach(initialize);
    
    it("pauser can unpause the contract", async () => {
      await contractInstance.pause({from: pauser});
      let unpause_tx = await contractInstance.unpause({from: pauser});
      await truffleAssert.eventEmitted(unpause_tx, 'Pause', {status: false, sender: pauser}, 'Pause event should be emitted with correct parameters');
    });

    it("non pauser cannot unpause the contract", async () => {
      let non_pauser = accounts[11];
      await contractInstance.pause({from: pauser});
      await truffleAssert.reverts(
        contractInstance.unpause({from: non_pauser}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
    
    it("unpause contract cannot unpause again", async () => {
      await contractInstance.pause({from: pauser});
      await contractInstance.unpause({from: pauser});
      await truffleAssert.reverts(
        contractInstance.unpause({from: pauser}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );      
    });
  });
})
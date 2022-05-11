
//modified 2022/04/05 start
// const Token = artifacts.require("Token_v1");
// const Token = artifacts.require("Token_v2");
const Token = artifacts.require("Token_v3");
//modified 2020/04/05 end;
const truffleAssert = require('truffle-assertions');

contract("MinterAdmin.sol", (accounts) => {
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

  describe('Test changeMinter function', function() {
    beforeEach(initialize);
    
    it("MinterAdmin can change the minter", async () => {
      let new_minter = accounts[11];
      let changeMinter_tx = await contractInstance.changeMinter(new_minter, {from: minterAdmin});
      await truffleAssert.eventEmitted(changeMinter_tx, 'MinterChanged', {oldMinter: minter, newMinter: new_minter, sender: minterAdmin}, 'MinterChanged event should be emitted with correct parameters');
    });

    it("non minterAdmin cannot change the minter", async () => {
      let non_minterAdmin = accounts[11];
      let new_minter = accounts[12];
      await truffleAssert.reverts(
        contractInstance.changeMinter(new_minter, {from: non_minterAdmin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("paused contract cannot change the minter", async () => {
      let new_minter = accounts[11];
      await contractInstance.pause({from: pauser});
      await truffleAssert.reverts(
        contractInstance.changeMinter(new_minter, {from: minterAdmin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("cannot change the minter to zero address", async () => {
      await truffleAssert.reverts(
        contractInstance.changeMinter(zero_address, {from: minterAdmin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });
})
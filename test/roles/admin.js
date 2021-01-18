//modified 2020/08/24 start
//const Token = artifacts.require("Token_v1");
const Token = artifacts.require("Token_v2");
//modified 2020/08/24 end
const truffleAssert = require('truffle-assertions');

contract("Admin.sol", (accounts) => {
  let contractInstance;
  let owner = accounts[0];
  let admin = accounts[1];
  let capper = accounts[2];
  let prohibiter = accounts[3];
  let pauser = accounts[4];
  let minterAdmin = accounts[5];
  let minter = accounts[6];
  let wiper = accounts[7];
  let zero_address = '0x0000000000000000000000000000000000000000'

  var initialize =  async () => {
    contractInstance = await Token.new();
    await contractInstance.initialize('A', 'a', 1, owner, admin, capper, prohibiter, pauser, minterAdmin, minter);
    await contractInstance.initializeWiper(wiper);
  }

  describe('Test changeCapper function', function() {
    beforeEach(initialize);
    
    it("admin can change the capper", async () => {
      let new_capper = accounts[11];
      let changeCapper_tx = await contractInstance.changeCapper(new_capper, {from: admin});
      await truffleAssert.eventEmitted(changeCapper_tx, 'CapperChanged', {oldCapper: capper, newCapper: new_capper, sender: admin}, 'CapperChanged event should be emitted with correct parameters');
    });

    it("non admin cannot change the capper", async () => {
      let non_admin = accounts[11];
      let new_capper = accounts[12];
      await truffleAssert.reverts(
        contractInstance.changeCapper(new_capper, {from: non_admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("paused contract cannot change the capper", async () => {
      let new_capper = accounts[11];
      await contractInstance.pause({from: pauser});
      await truffleAssert.reverts(
        contractInstance.changeCapper(new_capper, {from: admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("cannot change the capper to zero address", async () => {
      await truffleAssert.reverts(
        contractInstance.changeCapper(zero_address, {from: admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });

  describe('Test changePauser function', function() {
    beforeEach(initialize);
    
    it("admin can change the pauser", async () => {
      let new_pauser = accounts[11];
      let changePauser_tx = await contractInstance.changePauser(new_pauser, {from: admin});
      await truffleAssert.eventEmitted(changePauser_tx, 'PauserChanged', {oldPauser: pauser, newPauser: new_pauser, sender: admin}, 'PauserChanged event should be emitted with correct parameters');
    });

    it("non admin cannot change the pauser", async () => {
      let non_admin = accounts[11];
      let new_pauser = accounts[12];
      await truffleAssert.reverts(
        contractInstance.changePauser(new_pauser, {from: non_admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("cannot change the pauser to zero address", async () => {
      await truffleAssert.reverts(
        contractInstance.changePauser(zero_address, {from: admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });

  describe('Test changeProhibiter function', function() {
    beforeEach(initialize);
    
    it("admin can change the prohibiter", async () => {
      let new_prohibiter = accounts[11];
      let changeProhibiter_tx = await contractInstance.changeProhibiter(new_prohibiter, {from: admin});
      await truffleAssert.eventEmitted(changeProhibiter_tx, 'ProhibiterChanged', {oldProhibiter: prohibiter, newProhibiter: new_prohibiter, sender: admin}, 'ProhibiterChanged event should be emitted with correct parameters');
    });

    it("non admin cannot change the prohibiter", async () => {
      let non_admin = accounts[11];
      let new_prohibiter = accounts[12];
      await truffleAssert.reverts(
        contractInstance.changeProhibiter(new_prohibiter, {from: non_admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("paused contract cannot change the prohibiter", async () => {
      let new_prohibiter = accounts[11];
      await contractInstance.pause({from: pauser});
      await truffleAssert.reverts(
        contractInstance.changeProhibiter(new_prohibiter, {from: admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("cannot change the prohibiter to zero address", async () => {
      await truffleAssert.reverts(
        contractInstance.changeProhibiter(zero_address, {from: admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });

  describe('Test changeWiper function', function() {
    beforeEach(initialize);
    
    it("admin can change the wiper", async () => {
      let new_wiper = accounts[11];
      let changeWiper_tx = await contractInstance.changeWiper(new_wiper, {from: admin});
      await truffleAssert.eventEmitted(changeWiper_tx, 'WiperChanged', {oldWiper: wiper, newWiper: new_wiper, sender: admin}, 'WiperChanged event should be emitted with correct parameters');
    });

    it("non admin cannot change the wiper", async () => {
      let non_admin = accounts[11];
      let new_wiper = accounts[12];
      await truffleAssert.reverts(
        contractInstance.changeWiper(new_wiper, {from: non_admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("paused contract cannot change the wiper", async () => {
      let new_wiper = accounts[11];
      await contractInstance.pause({from: pauser});
      await truffleAssert.reverts(
        contractInstance.changeWiper(new_wiper, {from: admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("cannot change the wiper to zero address", async () => {
      await truffleAssert.reverts(
        contractInstance.changeWiper(zero_address, {from: admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });

})
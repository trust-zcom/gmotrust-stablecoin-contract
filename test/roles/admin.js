const Web3EthAbi = require('web3-eth-abi');
//modified 2022/04/05 start
//const Token = artifacts.require("Token_v1");
//const Token = artifacts.require("Token_v2");
const Token = artifacts.require("Token_v3");
//modified 2022/054/05 end;
const truffleAssert = require('truffle-assertions');
const GYEN = artifacts.require("GYEN");
const abi = require("../../build/contracts/Token_v3.json").abi;
const [initializeAbi] = abi.filter((f) => f.name === 'initialize');

contract("Admin.sol", (accounts) => {
  let tokenInstance;
  let gyenInstance;
  let owner = accounts[0];
  let admin = accounts[1];
  let capper = accounts[2];
  let prohibiter = accounts[3];
  let pauser = accounts[4];
  let minterAdmin = accounts[5];
  let minter = accounts[6];
  let wiper = accounts[7];
  let rescuer = accounts[8];
  let operator1 = accounts[9];
  let operator2 = accounts[10];
  let proxyAdmin = accounts[14];
  let data = Web3EthAbi.encodeFunctionCall(initializeAbi, ['A', 'a', 6, owner, admin, capper, prohibiter, pauser, minterAdmin, minter]);
  let zero_address = '0x0000000000000000000000000000000000000000'

  var initialize =  async () => {
    tokenInstance = await Token.new();
    gyenProxy = await GYEN.new(tokenInstance.address, proxyAdmin, data);
    gyenInstance = await Token.at(gyenProxy.address);
    await gyenInstance.initializeWiper(wiper);
    await gyenInstance.initializeV3(rescuer, operator1, operator2);
  }

  describe('Test changeCapper function', function() {
    beforeEach(initialize);
    
    it("admin can change the capper", async () => {
      let new_capper = accounts[11];
      let changeCapper_tx = await gyenInstance.changeCapper(new_capper, {from: admin});
      await truffleAssert.eventEmitted(changeCapper_tx, 'CapperChanged', {oldCapper: capper, newCapper: new_capper, sender: admin}, 'CapperChanged event should be emitted with correct parameters');
    });

    it("non admin cannot change the capper", async () => {
      let non_admin = accounts[11];
      let new_capper = accounts[12];
      await truffleAssert.reverts(
        gyenInstance.changeCapper(new_capper, {from: non_admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("paused contract cannot change the capper", async () => {
      let new_capper = accounts[11];
      await gyenInstance.pause({from: pauser});
      await truffleAssert.reverts(
        gyenInstance.changeCapper(new_capper, {from: admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("cannot change the capper to zero address", async () => {
      await truffleAssert.reverts(
        gyenInstance.changeCapper(zero_address, {from: admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });

  describe('Test changePauser function', function() {
    beforeEach(initialize);
    
    it("admin can change the pauser", async () => {
      let new_pauser = accounts[11];
      let changePauser_tx = await gyenInstance.changePauser(new_pauser, {from: admin});
      await truffleAssert.eventEmitted(changePauser_tx, 'PauserChanged', {oldPauser: pauser, newPauser: new_pauser, sender: admin}, 'PauserChanged event should be emitted with correct parameters');
    });

    it("non admin cannot change the pauser", async () => {
      let non_admin = accounts[11];
      let new_pauser = accounts[12];
      await truffleAssert.reverts(
        gyenInstance.changePauser(new_pauser, {from: non_admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("cannot change the pauser to zero address", async () => {
      await truffleAssert.reverts(
        gyenInstance.changePauser(zero_address, {from: admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });

  describe('Test changeProhibiter function', function() {
    beforeEach(initialize);
    
    it("admin can change the prohibiter", async () => {
      let new_prohibiter = accounts[11];
      let changeProhibiter_tx = await gyenInstance.changeProhibiter(new_prohibiter, {from: admin});
      await truffleAssert.eventEmitted(changeProhibiter_tx, 'ProhibiterChanged', {oldProhibiter: prohibiter, newProhibiter: new_prohibiter, sender: admin}, 'ProhibiterChanged event should be emitted with correct parameters');
    });

    it("non admin cannot change the prohibiter", async () => {
      let non_admin = accounts[11];
      let new_prohibiter = accounts[12];
      await truffleAssert.reverts(
        gyenInstance.changeProhibiter(new_prohibiter, {from: non_admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("paused contract cannot change the prohibiter", async () => {
      let new_prohibiter = accounts[11];
      await gyenInstance.pause({from: pauser});
      await truffleAssert.reverts(
        gyenInstance.changeProhibiter(new_prohibiter, {from: admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("cannot change the prohibiter to zero address", async () => {
      await truffleAssert.reverts(
        gyenInstance.changeProhibiter(zero_address, {from: admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });

  describe('Test changeWiper function', function() {
    beforeEach(initialize);
    
    it("admin can change the wiper", async () => {
      let new_wiper = accounts[11];
      let changeWiper_tx = await gyenInstance.changeWiper(new_wiper, {from: admin});
      await truffleAssert.eventEmitted(changeWiper_tx, 'WiperChanged', {oldWiper: wiper, newWiper: new_wiper, sender: admin}, 'WiperChanged event should be emitted with correct parameters');
    });

    it("non admin cannot change the wiper", async () => {
      let non_admin = accounts[11];
      let new_wiper = accounts[12];
      await truffleAssert.reverts(
        gyenInstance.changeWiper(new_wiper, {from: non_admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("paused contract cannot change the wiper", async () => {
      let new_wiper = accounts[11];
      await gyenInstance.pause({from: pauser});
      await truffleAssert.reverts(
        gyenInstance.changeWiper(new_wiper, {from: admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("cannot change the wiper to zero address", async () => {
      await truffleAssert.reverts(
        gyenInstance.changeWiper(zero_address, {from: admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });


  describe('Test changeRescuer function', function() {
    beforeEach(initialize);

    it("admin can change the rescuer", async () => {
      let new_rescuer = accounts[12];
      let changeRescuer_tx = await gyenInstance.changeRescuer(new_rescuer, {from: admin});
      await truffleAssert.eventEmitted(changeRescuer_tx, 'RescuerChanged', {oldRescuer: rescuer, newRescuer: new_rescuer, sender: admin}, 'RescueChanged event should be emitted with correct parameters');
    });

    it("non admin cannot change the rescuer", async () => {
      let non_admin = accounts[12];
      let new_rescuer = accounts[13];
      await truffleAssert.reverts(
        gyenInstance.changeRescuer(new_rescuer, {from: non_admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("paused contract cannot change the rescuer", async () => {
      let new_rescuer = accounts[12];
      await gyenInstance.pause({from: pauser});
      await truffleAssert.reverts(
        gyenInstance.changeRescuer(new_rescuer, {from: admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("cannot change the rescuer to zero address", async () => {
      await truffleAssert.reverts(
        gyenInstance.changeRescuer(zero_address, {from: admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });


  describe('Test changeOperator function', function() {
    beforeEach(initialize);

    it("admin can change operator1", async () => {
      let new_operator1 = accounts[11];
      let changeOperator_tx1 = await gyenInstance.changeOperator(new_operator1, 1, {from: admin});
      await truffleAssert.eventEmitted(changeOperator_tx1, 'OperatorChanged', (ev) => {
        return ev.oldOperator === operator1 && ev.newOperator === new_operator1 && ev.index.toNumber() === 1 && ev.sender === admin;
      }, 'OperatorChanged event should be emitted with correct parameters');
    });

    it("admin can change operator2", async () => {
      let new_operator2 = accounts[12];
      let changeOperator_tx2 = await gyenInstance.changeOperator(new_operator2, 2, {from: admin});
      await truffleAssert.eventEmitted(changeOperator_tx2, 'OperatorChanged', (ev) => {
        return ev.oldOperator === operator2 && ev.newOperator === new_operator2 && ev.index.toNumber() === 2 && ev.sender === admin;
      }, 'OperatorChanged event should be emitted with correct parameters');
    });

    it("non admin cannot change the operator1", async () => {
      let non_admin = accounts[11];
      let new_operator1 = accounts[12];
      await truffleAssert.reverts(
        gyenInstance.changeOperator(new_operator1, 1, {from: non_admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
    it("non admin cannot change the operator2", async () => {
      let non_admin = accounts[11];
      let new_operator2 = accounts[12];
      await truffleAssert.reverts(
        gyenInstance.changeOperator(new_operator2, 2,  {from: non_admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("cannot change the operator1 to zero address", async () => {
      await truffleAssert.reverts(
        gyenInstance.changeOperator(zero_address, 1, {from: admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
    it("cannot change the operator2 to zero address", async () => {
      await truffleAssert.reverts(
        gyenInstance.changeOperator(zero_address, 2, {from: admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("cannot change the operator other than operator1,operator2", async () => {
      let new_operator = accounts[11];
      await truffleAssert.reverts(
        gyenInstance.changeOperator(new_operator, 3, {from: admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("paused contract cannot change the operator1", async () => {
      let new_operator1 = accounts[11];
      await gyenInstance.pause({from: pauser});
      await truffleAssert.reverts(
        gyenInstance.changeOperator(new_operator1, 1,  {from: admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
    it("paused contract cannot change the operator2", async () => {
      let new_operator2 = accounts[11];
      await gyenInstance.pause({from: pauser});
      await truffleAssert.reverts(
        gyenInstance.changeOperator(new_operator2, 2,  {from: admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });

  describe('Operator can not been initialized as zero address', async function() {
    //beforeEach(initialize);
    tokenInstance = await Token.new();
    gyenProxy = await GYEN.new(tokenInstance.address, proxyAdmin, data);
    gyenInstance = await Token.at(gyenProxy.address);
    await gyenInstance.initializeWiper(wiper);
    //await gyenInstance.initializeV3(rescuer, operator1, operator2);
    it("Operator1 can not been initialized as zero address", async () => {
      await truffleAssert.reverts(
        gyenInstance.initializeV3(rescuer, zero_address, operator2),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("Operator2 can not been initialized as zero address", async () => {
      await truffleAssert.reverts(
        gyenInstance.initializeV3(rescuer, operator1, zero_address),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });
})
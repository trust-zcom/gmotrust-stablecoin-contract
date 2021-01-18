const BurningFactory = artifacts.require("BurningFactory");
const truffleAssert = require('truffle-assertions');

contract("BurningFactory.sol", (accounts) => {
  let burningFactoryInstance;
  let burningFactoryOwner = accounts[0];
  let manager = accounts[1];
  let burner = accounts[2];
  let zero_address = '0x0000000000000000000000000000000000000000'
  
  describe('Test constructor function', function() {
    it("should create BurningFactory instance", async () => {
      burningFactoryInstance = await BurningFactory.new(manager, burner, {from: burningFactoryOwner})
      let tx_result = await truffleAssert.createTransactionResult(burningFactoryInstance, burningFactoryInstance.transactionHash);
      await truffleAssert.eventEmitted(tx_result, 'BurnerChanged', {oldBurner: zero_address, newBurner: burner}, 'BurnerChanged event should be emitted with correct parameters');
    })

    it("manager address should not be zero", async () => {
      await truffleAssert.reverts(
        BurningFactory.new(zero_address, burner, {from: burningFactoryOwner}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("burner address should not be zero", async () => {
      await truffleAssert.reverts(
        BurningFactory.new(manager, zero_address, {from: burningFactoryOwner}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });
  
  describe('Test deploy function', function() {
    beforeEach(async () => {
      burningFactoryInstance = await BurningFactory.new(manager, burner, {from: burningFactoryOwner});
    });
    
    it("Can deploy new burning", async () => {
      let deploy_tx = await burningFactoryInstance.deploy({from: burner});
      await truffleAssert.eventEmitted(deploy_tx, 'Deployed', null, 'Deployed event should be emitted with correct parameters');
    });
    
    //add 2020/08/24 start
    it("non burner cannot deploy", async () => {
      let non_burner = accounts[3];
      await truffleAssert.reverts(
        burningFactoryInstance.deploy({from: non_burner}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
    //add 2020/08/24 end

  });

  describe('Test changeBurner function', function() {
    beforeEach(async () => {
      burningFactoryInstance = await BurningFactory.new(manager, burner, {from: burningFactoryOwner});
    });
    
    it("Manager can change burner", async () => {
      let new_burner = accounts[3];
      let changeBurner_tx = await burningFactoryInstance.changeBurner(new_burner, {from: manager});
      await truffleAssert.eventEmitted(changeBurner_tx, 'BurnerChanged', {newBurner: new_burner, sender: manager}, 'BurnerChanged event should be emitted with correct parameters');
      let burner = await burningFactoryInstance.burner();
      assert.strictEqual(new_burner, burner, "New burner not correct!");
    });

    it("non manager cannot change burner", async () => {
      let non_manager = accounts[3];
      let new_burner = accounts[4];
      await truffleAssert.reverts(
        burningFactoryInstance.changeBurner(new_burner, {from: non_manager}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("burner address should not be zero", async () => {
      await truffleAssert.reverts(
        burningFactoryInstance.changeBurner(zero_address, {from: manager}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });
})

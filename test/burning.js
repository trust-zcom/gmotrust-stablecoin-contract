const BurningFactory = artifacts.require("BurningFactory");
const Burning = artifacts.require("Burning");
//modified 2020/08/24 start
//const Token = artifacts.require("Token_v1");
const Token = artifacts.require("Token_v2");
//modified 2020/08/24
const truffleAssert = require('truffle-assertions');

contract("Burning.sol", (accounts) => {
  let tokenInstance;
  let burningFactoryInstance;
  let burningFactoryOwner = accounts[0];
  let tokenOwner = accounts[1];
  let manager = accounts[2];
  let burner = accounts[3];
  let zero_address = '0x0000000000000000000000000000000000000000'
  
  var initialize =  async () => {
    burningFactoryInstance = await BurningFactory.new(manager, burner, {from: burningFactoryOwner});
    tokenInstance = await Token.new();
    await tokenInstance.initialize('A', 'a', 1, tokenOwner, tokenOwner, tokenOwner, tokenOwner, tokenOwner, tokenOwner, tokenOwner);
  }

  describe('Test burn function', function() {
    beforeEach(initialize);
    
    it("Burner can burn", async () => {
      let deploy_tx = await burningFactoryInstance.deploy({from: burner});
      let burning_address = deploy_tx.logs[0].args.burning;
      let burning_instance = await Burning.at(burning_address);
      await tokenInstance.cap(100, {from: tokenOwner});
      await tokenInstance.mint(burning_address, 10, {from: tokenOwner});
      await burning_instance.burn(tokenInstance.address, 9, {from: burner});
      let balance = await tokenInstance.balanceOf(burning_address);
      assert.strictEqual(balance.toNumber(), 1, "Balance after burn not correct!");
    });

    it("Non burner cannot burn", async () => {
      let non_burner = accounts[4];
      let deploy_tx = await burningFactoryInstance.deploy({from: burner});
      let burning_address = deploy_tx.logs[0].args.burning;
      let burning_instance = await Burning.at(burning_address);
      await tokenInstance.cap(100, {from: tokenOwner});
      await tokenInstance.mint(burning_address, 10, {from: tokenOwner});
      await truffleAssert.reverts(
        burning_instance.burn(tokenInstance.address, 9, {from: non_burner}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });

  describe('Test transfer function', function() {
    beforeEach(initialize);

    it("Burner can transfer", async () => {
      let deploy_tx = await burningFactoryInstance.deploy({from: burner});
      let burning_address = deploy_tx.logs[0].args.burning;
      let burning_instance = await Burning.at(burning_address);
      await tokenInstance.cap(100, {from: tokenOwner});
      await tokenInstance.mint(burning_address, 10, {from: tokenOwner});

      let recipient = `0x${require('crypto').randomBytes(20).toString('hex')}`
      await burning_instance.transfer(tokenInstance.address, recipient, 9, {from: burner});
      let balance = await tokenInstance.balanceOf(burning_address);
      assert.strictEqual(balance.toNumber(), 1, "Balance after transfer not correct!");
      let recipientBalance = await tokenInstance.balanceOf(recipient);
      assert.strictEqual(recipientBalance.toNumber(), 9, "Balance of recipient after transfer not correct!");
    });

    it("Non burner cannot transfer", async () => {
      let non_burner = accounts[4];
      let deploy_tx = await burningFactoryInstance.deploy({from: burner});
      let burning_address = deploy_tx.logs[0].args.burning;
      let burning_instance = await Burning.at(burning_address);
      await tokenInstance.cap(100, {from: tokenOwner});
      await tokenInstance.mint(burning_address, 10, {from: tokenOwner});

      let recipient = `0x${require('crypto').randomBytes(20).toString('hex')}`
      await truffleAssert.reverts(
        burning_instance.transfer(tokenInstance.address, recipient, 9, {from: non_burner}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("Transfer should fail when burning was prohibited", async () => {
      let deploy_tx = await burningFactoryInstance.deploy({from: burner});
      let burning_address = deploy_tx.logs[0].args.burning;
      let burning_instance = await Burning.at(burning_address);
      await tokenInstance.cap(100, {from: tokenOwner});
      await tokenInstance.mint(burning_address, 10, {from: tokenOwner});

      let recipient = `0x${require('crypto').randomBytes(20).toString('hex')}`

      await tokenInstance.prohibit(burning_address, {from: tokenOwner});
      await truffleAssert.reverts(
        burning_instance.transfer(tokenInstance.address, recipient, 9, {from: burner}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("Transfer should fail when contract was paused", async () => {
      let deploy_tx = await burningFactoryInstance.deploy({from: burner});
      let burning_address = deploy_tx.logs[0].args.burning;
      let burning_instance = await Burning.at(burning_address);
      await tokenInstance.cap(100, {from: tokenOwner});
      await tokenInstance.mint(burning_address, 10, {from: tokenOwner});

      let recipient = `0x${require('crypto').randomBytes(20).toString('hex')}`

      await tokenInstance.pause({from: tokenOwner});
      await truffleAssert.reverts(
        burning_instance.transfer(tokenInstance.address, recipient, 9, {from: burner}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("Transfer should fail when recipient was zero address", async () => {
      let deploy_tx = await burningFactoryInstance.deploy({from: burner});
      let burning_address = deploy_tx.logs[0].args.burning;
      let burning_instance = await Burning.at(burning_address);
      await tokenInstance.cap(100, {from: tokenOwner});
      await tokenInstance.mint(burning_address, 10, {from: tokenOwner});

      await tokenInstance.pause({from: tokenOwner});
      await truffleAssert.reverts(
        burning_instance.transfer(tokenInstance.address, zero_address, 9, {from: burner}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("Transfer should fail when amount was more than balance", async () => {
      let deploy_tx = await burningFactoryInstance.deploy({from: burner});
      let burning_address = deploy_tx.logs[0].args.burning;
      let burning_instance = await Burning.at(burning_address);
      await tokenInstance.cap(100, {from: tokenOwner});
      await tokenInstance.mint(burning_address, 10, {from: tokenOwner});

      let recipient = `0x${require('crypto').randomBytes(20).toString('hex')}`

      await tokenInstance.pause({from: tokenOwner});
      await truffleAssert.reverts(
        burning_instance.transfer(tokenInstance.address, recipient, 11, {from: burner}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });
})

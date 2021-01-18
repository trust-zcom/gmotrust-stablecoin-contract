
//modified 2020/08/24 start
//const Token = artifacts.require("Token_v1");
const Token = artifacts.require("Token_v2");
//modified 2020/08/24 end;
const GYEN = artifacts.require("GYEN");
const truffleAssert = require('truffle-assertions');
const Web3EthAbi = require('web3-eth-abi');

//const abi = require("../build/contracts/Token_v1.json").abi;
const abi = require("../build/contracts/Token_v2.json").abi;
const [initializeAbi] = abi.filter((f) => f.name === 'initialize');

contract("GYEN.sol", (accounts) => {
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
  let data = Web3EthAbi.encodeFunctionCall(initializeAbi, ['GMO JPY', 'GYEN', 6, owner, admin, capper, prohibiter, pauser, minterAdmin, minter]);
  let zero_address = '0x0000000000000000000000000000000000000000'

  var initialize =  async () => {
    tokenInstance = await Token.new();
    gyenProxy = await GYEN.new(tokenInstance.address, proxyAdmin, data);
    gyenInstance = await Token.at(gyenProxy.address);
    await gyenInstance.initializeWiper(wiper);
    await gyenInstance.cap(100, {from: capper});
  }

  describe('Test implementation of AdminUpgradeabilityProxy', function() {
    beforeEach(initialize);

    it("Admin can view address of implementation", async () => {
      let address = await gyenProxy.implementation.call({from: proxyAdmin});
      assert.strictEqual(address, tokenInstance.address, "Implementation address not correct!");
    });

    it("Non admin cannot view address of implementation", async () => {
      let non_admin = accounts[11];
      await truffleAssert.reverts(
        gyenProxy.implementation.call({from: non_admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });

  describe('Test admin of AdminUpgradeabilityProxy', function() {
    beforeEach(initialize);

    it("Admin can view address of admin", async () => {
      let address = await gyenProxy.admin.call({from: proxyAdmin});
      assert.strictEqual(address, proxyAdmin, "Implementation address not correct!");
    });

    it("Non admin cannot view address of admin", async () => {
      let non_admin = accounts[11];
      await truffleAssert.reverts(
        gyenProxy.implementation.call({from: non_admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });

  describe('Test changeAdmin of AdminUpgradeabilityProxy', function() {
    beforeEach(initialize);

    it("Admin can change admin of proxy", async () => {
      let new_admin = accounts[11];
      let changeAdmin_tx = await gyenProxy.changeAdmin(new_admin, {from: proxyAdmin});
      let admin = await gyenProxy.admin.call({from: new_admin});
      await truffleAssert.eventEmitted(changeAdmin_tx, 'AdminChanged', {previousAdmin: proxyAdmin, newAdmin: new_admin}, 'AdminChanged event should be emitted with correct parameters');
      await assert.strictEqual(new_admin, admin, "Admin address is not correct!");
    });

    it("Non admin cannot change admin of proxy", async () => {
      let non_admin =  accounts[11];
      let new_admin = accounts[12];
      await truffleAssert.reverts(
        gyenProxy.changeAdmin(new_admin, {from: non_admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("Cannot change admin of proxy to zero address", async () => {
      await truffleAssert.reverts(
        gyenProxy.changeAdmin(zero_address, {from: proxyAdmin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });

  describe('Test upgradeTo of AdminUpgradeabilityProxy', function() {
    beforeEach(initialize);

    it("Admin can upgrade the implementation of proxy", async () => {
      let new_implementation = await Token.new();
      let upgrade_tx = await gyenProxy.upgradeTo(new_implementation.address, {from: proxyAdmin});
      await truffleAssert.eventEmitted(upgrade_tx, 'Upgraded', {implementation: new_implementation.address}, 'Upgraded event should be emitted with correct parameters');
    });

    it("Non admin cannot upgrade the implementation of proxy", async () => {
      let non_admin = accounts[11];
      let new_implementation = await Token.new();
      await truffleAssert.reverts(
        gyenProxy.upgradeTo(new_implementation.address, {from: non_admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("Cannot upgrade implementation to non contract address", async () => {
      await truffleAssert.fails(
        gyenProxy.upgradeTo(accounts[11], {from: admin}),
        null,
        null,
        'This should be a fail test case!'
      );
      await truffleAssert.fails(
        gyenProxy.upgradeTo(zero_address, {from: admin}),
        null,
        null,
        'This should be a fail test case!'
      );
    })
  });

  describe('Test initialize function', function() {
    beforeEach(initialize);

    it("Initialize cannot call multiple times", async () => {
      await truffleAssert.reverts(
        gyenInstance.initialize('B', 'b', 1, owner, admin, capper, prohibiter, pauser, minterAdmin, minter),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

  });

  describe('Test initializeWiper function', function() {
    beforeEach(initialize);

    it("initializeWiper cannot call multiple times", async () => {
      await truffleAssert.reverts(
        gyenInstance.initializeWiper(wiper),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

  });

  describe('Test cap function', function() {
    beforeEach(initialize);
    
    it("set capacity success case", async () => {
      let cap_tx = await gyenInstance.cap(10, {from: capper});
      await truffleAssert.eventEmitted(cap_tx, 'Cap', (ev) => {
        return ev.newCapacity.toNumber() === 10 && ev.sender === capper;
      }, 'Cap event should be emitted with correct parameters');
    });

    it("non capper cannot set capacity", async () => {
      let non_capper = accounts[11];
      await truffleAssert.reverts(
        gyenInstance.cap(10, {from: non_capper}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("paused contract cannot set capacity", async () => {
      await gyenInstance.pause({from: pauser});
      await truffleAssert.reverts(
        gyenInstance.cap(10, {from: capper}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("set capacity less than the totalSupply should fail", async () => {
      await gyenInstance.mint(accounts[11], 10, {from: minter});
      await truffleAssert.reverts(
        gyenInstance.cap(9, {from: capper}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("cannot set cap to a non natural number", async () => {
      await truffleAssert.reverts(
        gyenInstance.cap(0, {from: capper}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });

  describe('Test mint function', function() {
    beforeEach(initialize);
    
    it("minter can mint", async () => {
      let mint_address = accounts[11];
      let mint_tx = await gyenInstance.mint(mint_address, 10, {from: minter});
      await truffleAssert.eventEmitted(mint_tx, 'Mint', (ev) => {
        return ev.mintee === mint_address && ev.amount.toNumber() === 10 && ev.sender === minter;
      }, 'Mint event should be emitted with correct parameters');
      balance = await gyenInstance.balanceOf(mint_address);
      assert.strictEqual(balance.toNumber(), 10, "Balance after mint not correct!");
    });
  
    it("non minter cannot mint", async () => {
      let non_minter = accounts[11];
      let mint_address = accounts[12];
      await truffleAssert.reverts(
        gyenInstance.mint(mint_address, 10, {from: non_minter}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  
    it("paused contract cannot be mint", async () => {
      let mint_address = accounts[11];
      await gyenInstance.pause({from: pauser});
      await truffleAssert.reverts(
        gyenInstance.mint(mint_address, 10, {from: minter}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  
    it("mint should not above capacity", async () => {
      let mint_address = accounts[11];
      await truffleAssert.reverts(
        gyenInstance.mint(mint_address, 101, {from: minter}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  
    it("mint should not above capacity", async () => {
      let mint_address = accounts[11];
      await gyenInstance.mint(mint_address, 90, {from: minter});
      await truffleAssert.reverts(
        gyenInstance.mint(mint_address, 11, {from: minter}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  
    it("mint address should not be zero", async () => {
      await truffleAssert.reverts(
        gyenInstance.mint(zero_address, 10, {from: minter}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    })

    it("mint should change the totalSupply", async () => {
      let mint_address = accounts[11];
      let old_totalSupply = await gyenInstance.totalSupply();
      await gyenInstance.mint(mint_address, 10, {from: minter});
      let new_totalSupply = await gyenInstance.totalSupply();
      assert.strictEqual(old_totalSupply.toNumber() + 10, new_totalSupply.toNumber(), "totalSupply not change after mint");
    })

    it("cannot mint a non natural number", async () => {
      let mint_address = accounts[11];
      await truffleAssert.reverts(
        gyenInstance.mint(mint_address, 0, {from: minter}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    })
  });

  describe('Test transfer function', function() {
    beforeEach(initialize);

    it("transfer success case", async () => {
      let sender = accounts[11];
      let recipient = accounts[12];
      await gyenInstance.mint(sender, 10, {from: minter});
      let transfer_tx = await gyenInstance.transfer(recipient, 10, {from: sender});
      await truffleAssert.eventEmitted(transfer_tx, 'Transfer', null, 'Transfer event should be emitted with correct parameters');
      balance = await gyenInstance.balanceOf(recipient);
      assert.strictEqual(balance.toNumber(), 10, "Balance of recipient not correct!");
    });
    
    it("prohibited account cannot transfer", async () => {
      let prohibited_sender = accounts[11];
      let recipient = accounts[12];
      await gyenInstance.mint(prohibited_sender, 10, {from: minter});
      await gyenInstance.prohibit(prohibited_sender, {from: prohibiter});
      await truffleAssert.reverts(
        gyenInstance.transfer(recipient, 10, {from: prohibited_sender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("paused contract cannot do transfer", async () => {
      let sender = accounts[11];
      let recipient = accounts[12];
      await gyenInstance.mint(sender, 10, {from: minter});
      await gyenInstance.pause({from: pauser});
      await truffleAssert.reverts(
        gyenInstance.transfer(recipient, 10, {from: sender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("recipient address should not be zero", async () => {
      let sender = accounts[11];
      await gyenInstance.mint(sender, 10, {from: minter});
      await truffleAssert.reverts(
        gyenInstance.transfer(zero_address, 10, {from: sender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("transfer with amount over balance should fail", async () => {
      let sender = accounts[11];
      let recipient = accounts[12];
      await gyenInstance.mint(sender, 10, {from: minter});
      await truffleAssert.reverts(
        gyenInstance.transfer(recipient, 11, {from: sender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("transfer with amount over balance should fail", async () => {
      let sender = accounts[11];
      let recipient = accounts[12];
      await gyenInstance.mint(sender, 10, {from: minter});
      await gyenInstance.transfer(recipient, 9, {from: sender});
      await truffleAssert.reverts(
        gyenInstance.transfer(recipient, 2, {from: sender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("cannot transfer with amount is not a natural number", async () => {
      let sender = accounts[11];
      let recipient = accounts[12];
      await gyenInstance.mint(sender, 10, {from: minter});
      
      await truffleAssert.reverts(
        gyenInstance.transfer(recipient, 0, {from: sender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });

  describe('Test transferFrom function', function() {
    beforeEach(initialize);

    it("transferFrom success case", async () => {
      let sender = accounts[11]
      let recipient = accounts[12];
      let spender = accounts[13];
      await gyenInstance.mint(sender, 10, {from: minter});
      await gyenInstance.approve(spender, 10, {from: sender});
      let transfer_tx = await gyenInstance.transferFrom(sender, recipient, 10, {from: spender});
      await truffleAssert.eventEmitted(transfer_tx, 'Transfer', null, 'Transfer event should be emitted with correct parameters');
      balance = await gyenInstance.balanceOf(recipient);
      assert.strictEqual(balance.toNumber(), 10, "Balance of recipient not correct!");
    });

    it("prohibited sender cannot transfer", async () => {
      let prohibited_sender = accounts[11];
      let recipient = accounts[12];
      let spender = accounts[13];
      await gyenInstance.mint(prohibited_sender, 10, {from: minter});
      await gyenInstance.approve(spender, 10, {from: prohibited_sender});
      await gyenInstance.prohibit(prohibited_sender, {from: prohibiter});
      await truffleAssert.reverts(
        gyenInstance.transferFrom(prohibited_sender, recipient, 10, {from: spender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("paused contract cannot do transfer", async () => {
      let sender = accounts[11];
      let recipient = accounts[12];
      let spender = accounts[13];
      await gyenInstance.mint(sender, 10, {from: minter});
      await gyenInstance.approve(spender, 10, {from: sender});
      await gyenInstance.pause({from: pauser});
      await truffleAssert.reverts(
        gyenInstance.transferFrom(sender, recipient, 10, {from: spender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("transfer amount that hasn't been approved should fail", async () => {
      let sender = accounts[11]
      let recipient = accounts[12];
      let spender = accounts[13];
      await gyenInstance.mint(sender, 10, {from: minter});
      await truffleAssert.reverts(
        gyenInstance.transferFrom(sender, recipient, 1, {from: spender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("transfer amount exceed approved amount should fail", async () => {
      let sender = accounts[11];
      let recipient = accounts[12];
      let spender = accounts[13];
      await gyenInstance.mint(sender, 10, {from: minter});
      await gyenInstance.approve(spender, 10, {from: sender});
      await truffleAssert.reverts(
        gyenInstance.transferFrom(sender, recipient, 11, {from: spender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("transfer amount exceed approved amount should fail", async () => {
      let sender = accounts[1];
      let recipient = accounts[2];
      let spender = accounts[3];
      await gyenInstance.mint(sender, 10, {from: minter});
      await gyenInstance.approve(spender, 10, {from: sender});
      await gyenInstance.transferFrom(sender, recipient, 9, {from: spender});
      await truffleAssert.reverts(
        gyenInstance.transferFrom(sender, recipient, 2, {from: spender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("recipient address should not be zero", async () => {
      let sender = accounts[11];
      let spender = accounts[12];
      await gyenInstance.mint(sender, 10, {from: minter});
      await gyenInstance.approve(spender, 10, {from: sender});
      await truffleAssert.reverts(
        gyenInstance.transferFrom(sender, zero_address, 10, {from: spender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("cannot transferFrom with amount is not a natural number", async () => {
      let sender = accounts[1];
      let recipient = accounts[2];
      let spender = accounts[3];
      await gyenInstance.mint(sender, 10, {from: minter});
      await gyenInstance.approve(spender, 10, {from: sender});

      await truffleAssert.reverts(
        gyenInstance.transferFrom(sender, recipient, 0, {from: spender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });

  describe('Test burn function', function() {
    beforeEach(initialize);
    
    it("burn success case", async () => {
      let burn_account = accounts[11];
      await gyenInstance.mint(burn_account, 10, {from: minter});
      let burn_tx = await gyenInstance.burn(5, {from: burn_account});
      await truffleAssert.eventEmitted(burn_tx, 'Burn', (ev) => {
        return ev.burnee === burn_account && ev.amount.toNumber() === 5 && ev.sender === burn_account;
      }, 'Burn event should be emitted with correct parameters');
      balance = await gyenInstance.balanceOf(burn_account);
      assert.strictEqual(balance.toNumber(), 5, "Balance of recipient not correct!");
    });

    it("burn should change the totalSupply", async () => {
      let burn_account = accounts[11];
      await gyenInstance.mint(burn_account, 10, {from: minter});
      let old_totalSupply = await gyenInstance.totalSupply();
      await gyenInstance.burn(5, {from: burn_account});
      let new_totalSupply = await gyenInstance.totalSupply();
      assert.strictEqual(old_totalSupply.toNumber() - 5, new_totalSupply.toNumber(), "totalSupply not change after burn!");
    });

    it("burn exceed the balance of account should fail", async () => {
      let burn_account = accounts[11];
      await gyenInstance.mint(burn_account, 10, {from: minter});
      await truffleAssert.reverts(
        gyenInstance.burn(11, {from: burn_account}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("burn exceed the balance of account should fail", async () => {
      let burn_account = accounts[11];
      await gyenInstance.mint(burn_account, 10, {from: minter});
      await gyenInstance.burn(9, {from: burn_account});
      await truffleAssert.reverts(
        gyenInstance.burn(2, {from: burn_account}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("cannot burn amount of non natural number", async () => {
      let burn_account = accounts[11];
      await gyenInstance.mint(burn_account, 10, {from: minter});
      
      await truffleAssert.reverts(
        gyenInstance.burn(0, {from: burn_account}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });

  describe('Test approve function', function() {
    beforeEach(initialize);

    it("initial allowance should be zero", async () => {
      let approver = accounts[11];
      let spender = accounts[12];
      let initial_allowance = await gyenInstance.allowance(approver, spender);
      assert.strictEqual(initial_allowance.toNumber(), 0, "Initial allowance not correct!");
    });

    it("approve should change the allowance", async () => {
      let approver = accounts[11];
      let spender = accounts[12];
      let old_allowance = await gyenInstance.allowance(approver, spender);
      await gyenInstance.mint(approver, 10, {from: minter});
      await gyenInstance.approve(spender, 9, {from: approver});
      let new_allowance = await gyenInstance.allowance(approver, spender);
      assert.strictEqual(old_allowance.toNumber() + 9, new_allowance.toNumber(), "Allowance after approve not correct!");
    });
  });

  describe('Test wipe function', function() {
    beforeEach(initialize);

    it("wiper can wipe", async () => {
      let wipe_address = accounts[11];
      await gyenInstance.mint(wipe_address, 10, {from: minter});
      await gyenInstance.prohibit(wipe_address, {from: prohibiter});
      let wipe_tx = await gyenInstance.wipe(wipe_address, {from: wiper});
      await truffleAssert.eventEmitted(wipe_tx, 'Wipe', (ev) => {
        return ev.addr === wipe_address && ev.amount.toNumber() === 10;
      }, 'wipe event should be emitted with correct parameters');
      balance = await gyenInstance.balanceOf(wipe_address);
      assert.strictEqual(balance.toNumber(), 0, "Balance after wipe not correct!");
    });
  
    it("non wiper cannot wipe", async () => {
      let wipe_address = accounts[11];
      let non_wiper = accounts[12];
      await gyenInstance.mint(wipe_address, 10, {from: minter});
      await gyenInstance.prohibit(wipe_address, {from: prohibiter});

      await truffleAssert.reverts(
        gyenInstance.wipe(wipe_address, {from: non_wiper}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
 
    it("no prohibited address cannot be wipe", async () => {
      let wipe_address = accounts[11];
      await gyenInstance.mint(wipe_address, 10, {from: minter});
      //await gyenInstance.prohibit(wipe_address, {from: prohibiter});

      await truffleAssert.reverts(
        gyenInstance.wipe(wipe_address, {from: wiper}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );

    });

    it("paused contract cannot be wipe", async () => {
      let wipe_address = accounts[11];
      await gyenInstance.mint(wipe_address, 10, {from: minter});
      await gyenInstance.prohibit(wipe_address, {from: prohibiter});
      await gyenInstance.pause({from: pauser});

      await truffleAssert.reverts(
        gyenInstance.wipe(wipe_address, {from: wiper}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );

    });

    it("wipe should change the totalSupply", async () => {
      let wipe_address = accounts[11];
      await gyenInstance.mint(wipe_address, 10, {from: minter});
      let old_totalSupply = await gyenInstance.totalSupply();
      await gyenInstance.prohibit(wipe_address, {from: prohibiter});
      await gyenInstance.wipe(wipe_address, {from: wiper});
      let new_totalSupply = await gyenInstance.totalSupply();

      assert.strictEqual(old_totalSupply.toNumber() - 10, new_totalSupply.toNumber(), "totalSupply not change after wipe");
    })

  });

})
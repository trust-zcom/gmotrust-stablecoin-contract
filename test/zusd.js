//modified 2022/03/01 start
//modified 2020/08/24 start
//const Token = artifacts.require("Token_v1");
//const Token = artifacts.require("Token_v2");
const Token = artifacts.require("Token_v3");
//modified 2020/08/24 end;
//modified 2022/03/01 end;
const ZUSD = artifacts.require("ZUSD");
const truffleAssert = require('truffle-assertions');
const Web3EthAbi = require('web3-eth-abi');

//const abi = require("../build/contracts/Token_v1.json").abi;
//const abi = require("../build/contracts/Token_v2.json").abi;
const abi = require("../build/contracts/Token_v3.json").abi;

const [initializeAbi] = abi.filter((f) => f.name === 'initialize');

contract("ZUSD.sol", (accounts) => {
  let tokenInstance;
  let zusdInstance;
  let owner = accounts[0];
  let admin = accounts[1];
  let capper = accounts[2];
  let prohibiter = accounts[3];
  let pauser = accounts[4];
  let minterAdmin = accounts[5];
  let minter = accounts[6];
  let proxyAdmin = accounts[7];
  let wiper = accounts[8];
  let rescuer = accounts[9];
  let operator1 = accounts[10];
  let operator2 = accounts[20];

  let data = Web3EthAbi.encodeFunctionCall(initializeAbi, ['GMO JPY', 'ZUSD', 6, owner, admin, capper, prohibiter, pauser, minterAdmin, minter]);
  let zero_address = '0x0000000000000000000000000000000000000000'

  var initialize =  async () => {
    tokenInstance = await Token.new();
    zusdProxy = await ZUSD.new(tokenInstance.address, proxyAdmin, data);
    zusdInstance = await Token.at(zusdProxy.address);
    await zusdInstance.initializeWiper(wiper);
    await zusdInstance.initializeV3(rescuer, operator1, operator2);
    await zusdInstance.cap(100, {from: capper});
  }

  describe('Test implementation of AdminUpgradeabilityProxy', function() {
    beforeEach(initialize);

    it("Admin can view address of implementation", async () => {
      let address = await zusdProxy.implementation.call({from: proxyAdmin});
      assert.strictEqual(address, tokenInstance.address, "Implementation address not correct!");
    });

    it("Non admin cannot view address of implementation", async () => {
      let non_admin = accounts[11];
      await truffleAssert.reverts(
        zusdProxy.implementation.call({from: non_admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });

  describe('Test admin of AdminUpgradeabilityProxy', function() {
    beforeEach(initialize);

    it("Admin can view address of admin", async () => {
      let address = await zusdProxy.admin.call({from: proxyAdmin});
      assert.strictEqual(address, proxyAdmin, "Implementation address not correct!");
    });

    it("Non admin cannot view address of admin", async () => {
      let non_admin = accounts[11];
      await truffleAssert.reverts(
        zusdProxy.implementation.call({from: non_admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });

  describe('Test changeAdmin of AdminUpgradeabilityProxy', function() {
    beforeEach(initialize);

    it("Admin can change admin of proxy", async () => {
      let new_admin = accounts[11];
      let changeAdmin_tx = await zusdProxy.changeAdmin(new_admin, {from: proxyAdmin});
      let admin = await zusdProxy.admin.call({from: new_admin});
      await truffleAssert.eventEmitted(changeAdmin_tx, 'AdminChanged', {previousAdmin: proxyAdmin, newAdmin: new_admin}, 'AdminChanged event should be emitted with correct parameters');
      await assert.strictEqual(new_admin, admin, "Admin address is not correct!");
    });

    it("Non admin cannot change admin of proxy", async () => {
      let non_admin =  accounts[11];
      let new_admin = accounts[12];
      await truffleAssert.reverts(
        zusdProxy.changeAdmin(new_admin, {from: non_admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("Cannot change admin of proxy to zero address", async () => {
      await truffleAssert.reverts(
        zusdProxy.changeAdmin(zero_address, {from: proxyAdmin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });

  describe('Test upgradeTo of AdminUpgradeabilityProxy', function() {
    beforeEach(initialize);

    it("Admin can upgrade the implementation of proxy", async () => {
      let new_implementation = await Token.new();
      let upgrade_tx = await zusdProxy.upgradeTo(new_implementation.address, {from: proxyAdmin});
      await truffleAssert.eventEmitted(upgrade_tx, 'Upgraded', {implementation: new_implementation.address}, 'Upgraded event should be emitted with correct parameters');
    });

    it("Non admin cannot upgrade the implementation of proxy", async () => {
      let non_admin = accounts[11];
      let new_implementation = await Token.new();
      await truffleAssert.reverts(
        zusdProxy.upgradeTo(new_implementation.address, {from: non_admin}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("Cannot upgrade implementation to non contract address", async () => {
      await truffleAssert.fails(
        zusdProxy.upgradeTo(accounts[11], {from: admin}),
        null,
        null,
        'This should be a fail test case!'
      );
      await truffleAssert.fails(
        zusdProxy.upgradeTo(zero_address, {from: admin}),
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
        zusdInstance.initialize('B', 'b', 1, owner, admin, capper, prohibiter, pauser, minterAdmin, minter),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

  });

  describe('Test initializeWiper function', function() {
    beforeEach(initialize);

    it("initializeWiper cannot call multiple times", async () => {
      await truffleAssert.reverts(
        zusdInstance.initializeWiper(wiper),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

  });

  describe('Test initializeV3 function', function() {
    beforeEach(initialize);

    it("initializeV3 cannot call multiple times", async () => {
      await truffleAssert.reverts(
        zusdInstance.initializeV3(rescuer, operator1, operator2),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

  });

  describe('Test cap function', function() {
    beforeEach(initialize);
    
    it("set capacity success case", async () => {
      let cap_tx = await zusdInstance.cap(10, {from: capper});
      await truffleAssert.eventEmitted(cap_tx, 'Cap', (ev) => {
        return ev.newCapacity.toNumber() === 10 && ev.sender === capper;
      }, 'Cap event should be emitted with correct parameters');
    });

    it("non capper cannot set capacity", async () => {
      let non_capper = accounts[11];
      await truffleAssert.reverts(
        zusdInstance.cap(10, {from: non_capper}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("paused contract cannot set capacity", async () => {
      await zusdInstance.pause({from: pauser});
      await truffleAssert.reverts(
        zusdInstance.cap(10, {from: capper}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("set capacity less than the totalSupply should fail", async () => {
      await zusdInstance.mint(accounts[11], 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});
      await truffleAssert.reverts(
        zusdInstance.cap(9, {from: capper}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("cannot set cap to a non natural number", async () => {
      await truffleAssert.reverts(
        zusdInstance.cap(0, {from: capper}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });

  describe('Test mint function', function() {
    beforeEach(initialize);
    // minter can create mint pending transaction
    it("minter can create pending mint transaction", async () => {
      let mint_address = accounts[11];
      let mint_tx = await zusdInstance.mint(mint_address, 10, {from: minter});
      const olBbalance = await zusdInstance.balanceOf(mint_address);
      //await truffleAssert.eventEmitted(mint_tx, 'Mint', (ev) => {
      //  return ev.mintee === mint_address && ev.amount.toNumber() === 10 && ev.sender === minter;
      //}, 'Mint event should be emitted with correct parameters');
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await truffleAssert.eventEmitted(mint_tx, 'PendingMintTransaction', (ev) => {
        return ev.transactionId.toNumber() === transactionId && ev.acount === mint_address && ev.amount.toNumber() === 10 && ev.sender === minter;
      }, 'PendingMintTransaction event should be emitted with correct parameters');
      const balance = await zusdInstance.balanceOf(mint_address);
      assert.strictEqual(balance.toNumber(), olBbalance.toNumber(), "Balance after mint not correct!");
    });
  
    it("non minter cannot mint", async () => {
      let non_minter = accounts[11];
      let mint_address = accounts[12];
      await truffleAssert.reverts(
        zusdInstance.mint(mint_address, 10, {from: non_minter}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  
    it("paused contract cannot be mint", async () => {
      let mint_address = accounts[11];
      await zusdInstance.pause({from: pauser});
      await truffleAssert.reverts(
        zusdInstance.mint(mint_address, 10, {from: minter}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  
    it("mint should not above capacity (mint once)", async () => {
      let mint_address = accounts[11];
      await truffleAssert.reverts(
        zusdInstance.mint(mint_address, 101, {from: minter}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  
    it("mint should not above capacity (mint twice)", async () => {
      let mint_address = accounts[11];
      await zusdInstance.mint(mint_address, 90, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});
      await truffleAssert.reverts(
        zusdInstance.mint(mint_address, 11, {from: minter}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  
    it("mint address should not be zero", async () => {
      await truffleAssert.reverts(
        zusdInstance.mint(zero_address, 10, {from: minter}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    })

    it("mint should not change the totalSupply before confirmed", async () => {
      let mint_address = accounts[11];
      let old_totalSupply = await zusdInstance.totalSupply();
      await zusdInstance.mint(mint_address, 10, {from: minter});
      let new_totalSupply = await zusdInstance.totalSupply();
      assert.strictEqual(old_totalSupply.toNumber(), new_totalSupply.toNumber(), "totalSupply not change after mint");
    })

    it("mint should change the totalSupply after confirmed", async () => {
      let mint_address = accounts[11];
      let old_totalSupply = await zusdInstance.totalSupply();
      await zusdInstance.mint(mint_address, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});
      let new_totalSupply = await zusdInstance.totalSupply();
      assert.strictEqual(old_totalSupply.toNumber() + 10, new_totalSupply.toNumber(), "totalSupply not change after mint");
    })

    it("cannot mint a non natural number", async () => {
      let mint_address = accounts[11];
      await truffleAssert.reverts(
        zusdInstance.mint(mint_address, 0, {from: minter}),
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
      await zusdInstance.mint(sender, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});

      let transfer_tx = await zusdInstance.transfer(recipient, 10, {from: sender});
      await truffleAssert.eventEmitted(transfer_tx, 'Transfer', null, 'Transfer event should be emitted with correct parameters');
      balance = await zusdInstance.balanceOf(recipient);
      assert.strictEqual(balance.toNumber(), 10, "Balance of recipient not correct!");
    });
    
    it("prohibited account cannot transfer", async () => {
      let prohibited_sender = accounts[11];
      let recipient = accounts[12];
      await zusdInstance.mint(prohibited_sender, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});
      await zusdInstance.prohibit(prohibited_sender, {from: prohibiter});
      await truffleAssert.reverts(
        zusdInstance.transfer(recipient, 10, {from: prohibited_sender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("paused contract cannot do transfer", async () => {
      let sender = accounts[11];
      let recipient = accounts[12];
      await zusdInstance.mint(sender, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});
      await zusdInstance.pause({from: pauser});
      await truffleAssert.reverts(
        zusdInstance.transfer(recipient, 10, {from: sender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("recipient address should not be zero", async () => {
      let sender = accounts[11];
      await zusdInstance.mint(sender, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});
      await truffleAssert.reverts(
        zusdInstance.transfer(zero_address, 10, {from: sender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("transfer with amount over balance should fail", async () => {
      let sender = accounts[11];
      let recipient = accounts[12];
      await zusdInstance.mint(sender, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});
      await truffleAssert.reverts(
        zusdInstance.transfer(recipient, 11, {from: sender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("transfer with amount over balance should fail", async () => {
      let sender = accounts[11];
      let recipient = accounts[12];
      await zusdInstance.mint(sender, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});
      await zusdInstance.transfer(recipient, 9, {from: sender});
      await truffleAssert.reverts(
        zusdInstance.transfer(recipient, 2, {from: sender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("cannot transfer with amount is not a natural number", async () => {
      let sender = accounts[11];
      let recipient = accounts[12];
      await zusdInstance.mint(sender, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});
      await truffleAssert.reverts(
        zusdInstance.transfer(recipient, 0, {from: sender}),
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
      await zusdInstance.mint(sender, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});
      await zusdInstance.approve(spender, 10, {from: sender});
      let transfer_tx = await zusdInstance.transferFrom(sender, recipient, 10, {from: spender});
      await truffleAssert.eventEmitted(transfer_tx, 'Transfer', null, 'Transfer event should be emitted with correct parameters');
      balance = await zusdInstance.balanceOf(recipient);
      assert.strictEqual(balance.toNumber(), 10, "Balance of recipient not correct!");
    });

    it("prohibited sender cannot transfer", async () => {
      let prohibited_sender = accounts[11];
      let recipient = accounts[12];
      let spender = accounts[13];
      await zusdInstance.mint(prohibited_sender, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});
      await zusdInstance.approve(spender, 10, {from: prohibited_sender});
      await zusdInstance.prohibit(prohibited_sender, {from: prohibiter});
      await truffleAssert.reverts(
        zusdInstance.transferFrom(prohibited_sender, recipient, 10, {from: spender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("paused contract cannot do transfer", async () => {
      let sender = accounts[11];
      let recipient = accounts[12];
      let spender = accounts[13];
      await zusdInstance.mint(sender, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});
      await zusdInstance.approve(spender, 10, {from: sender});
      await zusdInstance.pause({from: pauser});
      await truffleAssert.reverts(
        zusdInstance.transferFrom(sender, recipient, 10, {from: spender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("transfer amount that hasn't been approved should fail", async () => {
      let sender = accounts[11]
      let recipient = accounts[12];
      let spender = accounts[13];
      await zusdInstance.mint(sender, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});
      await truffleAssert.reverts(
        zusdInstance.transferFrom(sender, recipient, 1, {from: spender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("transfer amount exceed approved amount should fail", async () => {
      let sender = accounts[11];
      let recipient = accounts[12];
      let spender = accounts[13];
      await zusdInstance.mint(sender, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});
      await zusdInstance.approve(spender, 10, {from: sender});
      await truffleAssert.reverts(
        zusdInstance.transferFrom(sender, recipient, 11, {from: spender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("transfer amount exceed approved amount should fail", async () => {
      let sender = accounts[1];
      let recipient = accounts[2];
      let spender = accounts[3];
      await zusdInstance.mint(sender, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});
      await zusdInstance.approve(spender, 10, {from: sender});
      await zusdInstance.transferFrom(sender, recipient, 9, {from: spender});
      await truffleAssert.reverts(
        zusdInstance.transferFrom(sender, recipient, 2, {from: spender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("recipient address should not be zero", async () => {
      let sender = accounts[11];
      let spender = accounts[12];
      await zusdInstance.mint(sender, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});
      await zusdInstance.approve(spender, 10, {from: sender});
      await truffleAssert.reverts(
        zusdInstance.transferFrom(sender, zero_address, 10, {from: spender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("cannot transferFrom with amount is not a natural number", async () => {
      let sender = accounts[1];
      let recipient = accounts[2];
      let spender = accounts[3];
      await zusdInstance.mint(sender, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});
      await zusdInstance.approve(spender, 10, {from: sender});

      await truffleAssert.reverts(
        zusdInstance.transferFrom(sender, recipient, 0, {from: spender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });

  describe('Test burn function', function() {
    beforeEach(initialize);
    
    it("burn success case", async () => {
      let burn_account = accounts[11];
      await zusdInstance.mint(burn_account, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});
      let burn_tx = await zusdInstance.burn(5, {from: burn_account});
      await truffleAssert.eventEmitted(burn_tx, 'Burn', (ev) => {
        return ev.burnee === burn_account && ev.amount.toNumber() === 5 && ev.sender === burn_account;
      }, 'Burn event should be emitted with correct parameters');
      balance = await zusdInstance.balanceOf(burn_account);
      assert.strictEqual(balance.toNumber(), 5, "Balance of recipient not correct!");
    });

    it("burn should change the totalSupply", async () => {
      let burn_account = accounts[11];
      await zusdInstance.mint(burn_account, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});
      let old_totalSupply = await zusdInstance.totalSupply();
      await zusdInstance.burn(5, {from: burn_account});
      let new_totalSupply = await zusdInstance.totalSupply();
      assert.strictEqual(old_totalSupply.toNumber() - 5, new_totalSupply.toNumber(), "totalSupply not change after burn!");
    });

    it("burn exceed the balance of account should fail", async () => {
      let burn_account = accounts[11];
      await zusdInstance.mint(burn_account, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});
      await truffleAssert.reverts(
        zusdInstance.burn(11, {from: burn_account}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("burn exceed the balance of account should fail", async () => {
      let burn_account = accounts[11];
      await zusdInstance.mint(burn_account, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});
      await zusdInstance.burn(9, {from: burn_account});
      await truffleAssert.reverts(
        zusdInstance.burn(2, {from: burn_account}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("cannot burn amount of non natural number", async () => {
      let burn_account = accounts[11];
      await zusdInstance.mint(burn_account, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});
      await truffleAssert.reverts(
        zusdInstance.burn(0, {from: burn_account}),
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
      let initial_allowance = await zusdInstance.allowance(approver, spender);
      assert.strictEqual(initial_allowance.toNumber(), 0, "Initial allowance not correct!");
    });

    it("approve should change the allowance", async () => {
      let approver = accounts[11];
      let spender = accounts[12];
      let old_allowance = await zusdInstance.allowance(approver, spender);
      await zusdInstance.mint(approver, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});
      await zusdInstance.approve(spender, 9, {from: approver});
      let new_allowance = await zusdInstance.allowance(approver, spender);
      assert.strictEqual(old_allowance.toNumber() + 9, new_allowance.toNumber(), "Allowance after approve not correct!");
    });
  });

  describe('Test wipe function', function() {
    beforeEach(initialize);

    it("wiper can wipe", async () => {
      let wipe_address = accounts[11];
      await zusdInstance.mint(wipe_address, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});
      await zusdInstance.prohibit(wipe_address, {from: prohibiter});
      let wipe_tx = await zusdInstance.wipe(wipe_address, {from: wiper});
      await truffleAssert.eventEmitted(wipe_tx, 'Wipe', (ev) => {
        return ev.addr === wipe_address && ev.amount.toNumber() === 10;
      }, 'wipe event should be emitted with correct parameters');
      balance = await zusdInstance.balanceOf(wipe_address);
      assert.strictEqual(balance.toNumber(), 0, "Balance after wipe not correct!");
    });
  
    it("non wiper cannot wipe", async () => {
      let wipe_address = accounts[11];
      let non_wiper = accounts[12];
      await zusdInstance.mint(wipe_address, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});
      await zusdInstance.prohibit(wipe_address, {from: prohibiter});

      await truffleAssert.reverts(
        zusdInstance.wipe(wipe_address, {from: non_wiper}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
 
    it("no prohibited address cannot be wipe", async () => {
      let wipe_address = accounts[11];
      await zusdInstance.mint(wipe_address, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});
      //await zusdInstance.prohibit(wipe_address, {from: prohibiter});

      await truffleAssert.reverts(
        zusdInstance.wipe(wipe_address, {from: wiper}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );

    });

    it("paused contract cannot be wipe", async () => {
      let wipe_address = accounts[11];
      await zusdInstance.mint(wipe_address, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});
      await zusdInstance.prohibit(wipe_address, {from: prohibiter});
      await zusdInstance.pause({from: pauser});

      await truffleAssert.reverts(
        zusdInstance.wipe(wipe_address, {from: wiper}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );

    });

    it("wipe should change the totalSupply", async () => {
      let wipe_address = accounts[11];
      await zusdInstance.mint(wipe_address, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});
      let old_totalSupply = await zusdInstance.totalSupply();
      await zusdInstance.prohibit(wipe_address, {from: prohibiter});
      await zusdInstance.wipe(wipe_address, {from: wiper});
      let new_totalSupply = await zusdInstance.totalSupply();

      assert.strictEqual(old_totalSupply.toNumber() - 10, new_totalSupply.toNumber(), "totalSupply not change after wipe");
    })

  });

  describe('Test rescue function', function() {
    beforeEach(initialize);

    it("rescuer can rescue", async () => {
      let token_recever_address = accounts[12];
      await zusdInstance.mint(zusdProxy.address, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});
      let balance_zusd = await zusdInstance.balanceOf(zusdProxy.address);
      assert.strictEqual(balance_zusd.toNumber(), 10, "ZUSD contract balance is not correct!");

      let rescue_tx = await zusdInstance.rescue(zusdProxy.address,token_recever_address,6, {from: rescuer});
      await truffleAssert.eventEmitted(rescue_tx, 'Rescue', (ev) => {
        return ev.tokenAddr === zusdProxy.address && ev.toAddr === token_recever_address && ev.amount.toNumber() === 6;
      }, 'rescue event should be emitted with correct parameters');
      let balance_receiver = await zusdInstance.balanceOf(token_recever_address);
      assert.strictEqual(balance_receiver.toNumber(), 6, "Rescue receiver balance is not correct!");
      balance_zusd = await zusdInstance.balanceOf(zusdProxy.address);
      assert.strictEqual(balance_zusd.toNumber(), 4, "ZUSD contract balance is not correct afer 1st rescue!");

      rescue_tx = await zusdInstance.rescue(zusdProxy.address,token_recever_address,4, {from: rescuer});
      await truffleAssert.eventEmitted(rescue_tx, 'Rescue', (ev) => {
        return ev.tokenAddr === zusdProxy.address && ev.toAddr === token_recever_address && ev.amount.toNumber() === 4;
      }, 'rescue event should be emitted with correct parameters');
      balance_receiver = await zusdInstance.balanceOf(token_recever_address);
      assert.strictEqual(balance_receiver.toNumber(), 10, "Rescue receiver balance is not correct!");
      balance_zusd = await zusdInstance.balanceOf(zusdProxy.address);
      assert.strictEqual(balance_zusd.toNumber(), 0, "ZUSD contract balance is not correct afer 2nd rescue!");
    });

    it("non rescuer cannot rescue", async () => {
      let token_recever_address = accounts[12];
      let non_rescuer = accounts[13];
      await zusdInstance.mint(zusdProxy.address, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});

      await truffleAssert.reverts(
        zusdInstance.rescue(zusdProxy.address,token_recever_address,6, {from: non_rescuer}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("paused contract cannot rescue", async () => {
      let token_recever_address = accounts[12];
      await zusdInstance.mint(zusdProxy.address, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});
      await zusdInstance.pause({from: pauser});

      await truffleAssert.reverts(
        zusdInstance.rescue(zusdProxy.address,token_recever_address,6, {from: rescuer}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("can not rescue more than balance", async () => {
      let token_recever_address = accounts[12];
      await zusdInstance.mint(zusdProxy.address, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});

      await truffleAssert.reverts(
        zusdInstance.rescue(zusdProxy.address,token_recever_address,11, {from: rescuer}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("rescue should not change the totalSupply", async () => {
      let token_recever_address = accounts[12];
      await zusdInstance.mint(zusdProxy.address, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});

      let old_totalSupply = await zusdInstance.totalSupply();
      await zusdInstance.rescue(zusdProxy.address,token_recever_address,10, {from: rescuer});

      let new_totalSupply = await zusdInstance.totalSupply();

      assert.strictEqual(old_totalSupply.toNumber(), new_totalSupply.toNumber(), "totalSupply not change after rescue");
    });
  });


  describe('Test confirmMintTransaction function', function() {
    beforeEach(initialize);

    it("operator can confirm mint transaction", async () => {
      let token_recever_address = accounts[12];
      let balance_zusd_before = await zusdInstance.balanceOf(token_recever_address);
      let old_totalSupply = await zusdInstance.totalSupply();
      await zusdInstance.mint(token_recever_address, 10, {from: minter});

      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;

      let operator1_tx = await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await truffleAssert.eventEmitted(operator1_tx, 'Confirmation', (ev) => {
        return ev.transactionId.toNumber() === transactionId && ev.sender === operator1;
      }, 'Confirmation event should be emitted with correct parameters');

      let operator2_tx = await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});
      await truffleAssert.eventEmitted(operator2_tx, 'Confirmation', (ev) => {
        return ev.transactionId.toNumber() === transactionId && ev.sender === operator2;
      }, 'Confirmation event should be emitted with correct parameters');

      await truffleAssert.eventEmitted(operator2_tx, 'Mint', (ev) => {
        return ev.mintee === token_recever_address && ev.amount.toNumber() === 10 && ev.sender === operator2;
      }, 'Mint event should be emitted with correct parameters');

      let balance_zusd_after = await zusdInstance.balanceOf(token_recever_address);

      assert.strictEqual(balance_zusd_after.toNumber(), balance_zusd_before.toNumber() + 10, "ZUSD contract balance is not correct!");

      let new_totalSupply = await zusdInstance.totalSupply();
      assert.strictEqual(old_totalSupply.toNumber() + 10, new_totalSupply.toNumber(), "totalSupply not changed after mint");
    });

    it("non operator cannot confirm mint transaction", async () => {
      let token_recever_address = accounts[12];
      let non_operator = accounts[13];
      await zusdInstance.mint(token_recever_address, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;

      await truffleAssert.reverts(
        zusdInstance.confirmMintTransaction(transactionId, {from: non_operator}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("paused contract cannot confirm mint transaction", async () => {
      let token_recever_address = accounts[12];
      await zusdInstance.mint(token_recever_address, 10, {from: minter});
      await zusdInstance.pause({from: pauser});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;

      await truffleAssert.reverts(
        zusdInstance.confirmMintTransaction(transactionId, {from: operator1}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("can not confirm not existed pending mint transaction", async () => {
      let token_recever_address = accounts[12];
      await zusdInstance.mint(token_recever_address, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber();

      await truffleAssert.reverts(
        zusdInstance.confirmMintTransaction(transactionId, {from: operator1}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("can not confirm pending mint transaction twice", async () => {
      let token_recever_address = accounts[12];
      await zusdInstance.mint(token_recever_address, 10, {from: minter});
      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});

      await truffleAssert.reverts(
        zusdInstance.confirmMintTransaction(transactionId, {from: operator1}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });

  describe('Test isConfirmed function', function() {
    beforeEach(initialize);

    it("one confirmation return false", async () => {
      let token_recever_address = accounts[12];
      await zusdInstance.mint(token_recever_address, 10, {from: minter});

      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;

      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      const isConfirmed = await zusdInstance.isConfirmed(transactionId);
      assert.strictEqual(isConfirmed, false, "isConfirmed is not correct!");
    });

    it("two confirmations return true", async () => {
      let token_recever_address = accounts[12];
      await zusdInstance.mint(token_recever_address, 10, {from: minter});

      const mintTransactionCount = await zusdInstance.mintTransactionCount();
      const transactionId = mintTransactionCount.toNumber() - 1;

      await zusdInstance.confirmMintTransaction(transactionId, {from: operator1});
      await zusdInstance.confirmMintTransaction(transactionId, {from: operator2});

      const isConfirmed = await zusdInstance.isConfirmed(transactionId);
      assert.strictEqual(isConfirmed, true, "isConfirmed is not correct!");
    });
  });
})
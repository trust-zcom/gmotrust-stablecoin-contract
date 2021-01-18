
const Token = artifacts.require("Token_v1");
const truffleAssert = require('truffle-assertions');

contract("Token_v1.sol", (accounts) => {
  let tokenInstance;
  let owner = accounts[0];
  let admin = accounts[1];
  let capper = accounts[2];
  let prohibiter = accounts[3];
  let pauser = accounts[4];
  let minterAdmin = accounts[5];
  let minter = accounts[6];
  let zero_address = '0x0000000000000000000000000000000000000000'

  var initialize =  async () => {
    tokenInstance = await Token.new();
    await tokenInstance.initialize('A', 'a', 1, owner, admin, capper, prohibiter, pauser, minterAdmin, minter);
    await tokenInstance.cap(100, {from: capper});
  }

  describe('Test initialize function', function() {
    beforeEach(async () => {
      tokenInstance = await Token.new();
    })

    it("Initialize cannot call multiple times", async () => {
      await tokenInstance.initialize('A', 'a', 1, owner, admin, capper, prohibiter, pauser, minterAdmin, minter);

      await truffleAssert.reverts(
        tokenInstance.initialize('B', 'b', 1, owner, admin, capper, prohibiter, pauser, minterAdmin, minter),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("cannot initialize owner to zero address", async () => {
      await truffleAssert.reverts(
        tokenInstance.initialize('A', 'a', 1, zero_address, admin, capper, prohibiter, pauser, minterAdmin, minter),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("cannot initialize admin to zero address", async () => {
      await truffleAssert.reverts(
        tokenInstance.initialize('A', 'a', 1, owner, zero_address, capper, prohibiter, pauser, minterAdmin, minter),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("cannot initialize capper to zero address", async () => {
      await truffleAssert.reverts(
        tokenInstance.initialize('A', 'a', 1, owner, admin, zero_address, prohibiter, pauser, minterAdmin, minter),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("cannot initialize prohibiter to zero address", async () => {
      await truffleAssert.reverts(
        tokenInstance.initialize('A', 'a', 1, owner, admin, capper, zero_address, pauser, minterAdmin, minter),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("cannot initialize pauser to zero address", async () => {
      await truffleAssert.reverts(
        tokenInstance.initialize('A', 'a', 1, owner, admin, capper, prohibiter, zero_address, minterAdmin, minter),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("cannot initialize minterAdmin to zero address", async () => {
      await truffleAssert.reverts(
        tokenInstance.initialize('A', 'a', 1, owner, admin, capper, prohibiter, pauser, zero_address, minter),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("cannot initialize minter to zero address", async () => {
      await truffleAssert.reverts(
        tokenInstance.initialize('A', 'a', 1, owner, admin, capper, prohibiter, pauser, minterAdmin, zero_address),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });

  describe('Test cap function', function() {
    beforeEach(initialize);
    
    it("set capacity success case", async () => {
      let cap_tx = await tokenInstance.cap(10, {from: capper});
      await truffleAssert.eventEmitted(cap_tx, 'Cap', (ev) => {
        return ev.newCapacity.toNumber() === 10 && ev.sender === capper;
      }, 'Cap event should be emitted with correct parameters');
    });

    it("non capper cannot set capacity", async () => {
      let non_capper = accounts[11];
      await truffleAssert.reverts(
        tokenInstance.cap(10, {from: non_capper}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("paused contract cannot set capacity", async () => {
      await tokenInstance.pause({from: pauser});
      await truffleAssert.reverts(
        tokenInstance.cap(10, {from: capper}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("set capacity less than the totalSupply should fail", async () => {
      await tokenInstance.mint(accounts[11], 10, {from: minter});
      await truffleAssert.reverts(
        tokenInstance.cap(9, {from: capper}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("cannot set cap to a non natural number", async () => {
      await truffleAssert.reverts(
        tokenInstance.cap(0, {from: capper}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });

  describe('Test mint function', function() {
    beforeEach(initialize);
    
    it("minter can mint", async () => {
      let mint_address = accounts[11];
      let mint_tx = await tokenInstance.mint(mint_address, 10, {from: minter});
      await truffleAssert.eventEmitted(mint_tx, 'Mint', (ev) => {
        return ev.mintee === mint_address && ev.amount.toNumber() === 10 && ev.sender === minter;
      }, 'Mint event should be emitted with correct parameters');
      balance = await tokenInstance.balanceOf(mint_address);
      assert.strictEqual(balance.toNumber(), 10, "Balance after mint not correct!");
    });
  
    it("non minter cannot mint", async () => {
      let non_minter = accounts[11];
      let mint_address = accounts[12];
      await truffleAssert.reverts(
        tokenInstance.mint(mint_address, 10, {from: non_minter}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  
    it("paused contract cannot be mint", async () => {
      let mint_address = accounts[11];
      await tokenInstance.pause({from: pauser});
      await truffleAssert.reverts(
        tokenInstance.mint(mint_address, 10, {from: minter}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  
    it("mint should not above capacity", async () => {
      let mint_address = accounts[11];
      await truffleAssert.reverts(
        tokenInstance.mint(mint_address, 101, {from: minter}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  
    it("mint should not above capacity", async () => {
      let mint_address = accounts[11];
      await tokenInstance.mint(mint_address, 90, {from: minter});
      await truffleAssert.reverts(
        tokenInstance.mint(mint_address, 11, {from: minter}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  
    it("mint address should not be zero", async () => {
      await truffleAssert.reverts(
        tokenInstance.mint(zero_address, 10, {from: minter}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    })

    it("mint should change the totalSupply", async () => {
      let mint_address = accounts[11];
      let old_totalSupply = await tokenInstance.totalSupply();
      await tokenInstance.mint(mint_address, 10, {from: minter});
      let new_totalSupply = await tokenInstance.totalSupply();
      assert.strictEqual(old_totalSupply.toNumber() + 10, new_totalSupply.toNumber(), "totalSupply not change after mint");
    })

    it("cannot mint a non natural number", async () => {
      let mint_address = accounts[11];
      await truffleAssert.reverts(
        tokenInstance.mint(mint_address, 0, {from: minter}),
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
      await tokenInstance.mint(sender, 10, {from: minter});
      let transfer_tx = await tokenInstance.transfer(recipient, 10, {from: sender});
      await truffleAssert.eventEmitted(transfer_tx, 'Transfer', null, 'Transfer event should be emitted with correct parameters');
      balance = await tokenInstance.balanceOf(recipient);
      assert.strictEqual(balance.toNumber(), 10, "Balance of recipient not correct!");
    });
    
    it("prohibited account cannot transfer", async () => {
      let prohibited_sender = accounts[11];
      let recipient = accounts[12];
      await tokenInstance.mint(prohibited_sender, 10, {from: minter});
      await tokenInstance.prohibit(prohibited_sender, {from: prohibiter});
      await truffleAssert.reverts(
        tokenInstance.transfer(recipient, 10, {from: prohibited_sender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("paused contract cannot do transfer", async () => {
      let sender = accounts[11];
      let recipient = accounts[12];
      await tokenInstance.mint(sender, 10, {from: minter});
      await tokenInstance.pause({from: pauser});
      await truffleAssert.reverts(
        tokenInstance.transfer(recipient, 10, {from: sender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("recipient address should not be zero", async () => {
      let sender = accounts[11];
      await tokenInstance.mint(sender, 10, {from: minter});
      await truffleAssert.reverts(
        tokenInstance.transfer(zero_address, 10, {from: sender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("transfer with amount over balance should fail", async () => {
      let sender = accounts[11];
      let recipient = accounts[12];
      await tokenInstance.mint(sender, 10, {from: minter});
      await truffleAssert.reverts(
        tokenInstance.transfer(recipient, 11, {from: sender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("transfer with amount over balance should fail", async () => {
      let sender = accounts[11];
      let recipient = accounts[12];
      await tokenInstance.mint(sender, 10, {from: minter});
      await tokenInstance.transfer(recipient, 9, {from: sender});
      await truffleAssert.reverts(
        tokenInstance.transfer(recipient, 2, {from: sender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("cannot transfer with amount is not a natural number", async () => {
      let sender = accounts[11];
      let recipient = accounts[12];
      await tokenInstance.mint(sender, 10, {from: minter});
      
      await truffleAssert.reverts(
        tokenInstance.transfer(recipient, 0, {from: sender}),
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
      await tokenInstance.mint(sender, 10, {from: minter});
      await tokenInstance.approve(spender, 10, {from: sender});
      let transfer_tx = await tokenInstance.transferFrom(sender, recipient, 10, {from: spender});
      await truffleAssert.eventEmitted(transfer_tx, 'Transfer', null, 'Transfer event should be emitted with correct parameters');
      balance = await tokenInstance.balanceOf(recipient);
      assert.strictEqual(balance.toNumber(), 10, "Balance of recipient not correct!");
    });

    it("prohibited sender cannot transfer", async () => {
      let prohibited_sender = accounts[11];
      let recipient = accounts[12];
      let spender = accounts[13];
      await tokenInstance.mint(prohibited_sender, 10, {from: minter});
      await tokenInstance.approve(spender, 10, {from: prohibited_sender});
      await tokenInstance.prohibit(prohibited_sender, {from: prohibiter});
      await truffleAssert.reverts(
        tokenInstance.transferFrom(prohibited_sender, recipient, 10, {from: spender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("paused contract cannot do transfer", async () => {
      let sender = accounts[11];
      let recipient = accounts[12];
      let spender = accounts[13];
      await tokenInstance.mint(sender, 10, {from: minter});
      await tokenInstance.approve(spender, 10, {from: sender});
      await tokenInstance.pause({from: pauser});
      await truffleAssert.reverts(
        tokenInstance.transferFrom(sender, recipient, 10, {from: spender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("transfer amount that hasn't been approved should fail", async () => {
      let sender = accounts[11]
      let recipient = accounts[12];
      let spender = accounts[13];
      await tokenInstance.mint(sender, 10, {from: minter});
      await truffleAssert.reverts(
        tokenInstance.transferFrom(sender, recipient, 1, {from: spender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("transfer amount exceed approved amount should fail", async () => {
      let sender = accounts[11];
      let recipient = accounts[12];
      let spender = accounts[13];
      await tokenInstance.mint(sender, 10, {from: minter});
      await tokenInstance.approve(spender, 10, {from: sender});
      await truffleAssert.reverts(
        tokenInstance.transferFrom(sender, recipient, 11, {from: spender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("transfer amount exceed approved amount should fail", async () => {
      let sender = accounts[1];
      let recipient = accounts[2];
      let spender = accounts[3];
      await tokenInstance.mint(sender, 10, {from: minter});
      await tokenInstance.approve(spender, 10, {from: sender});
      await tokenInstance.transferFrom(sender, recipient, 9, {from: spender});
      await truffleAssert.reverts(
        tokenInstance.transferFrom(sender, recipient, 2, {from: spender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("recipient address should not be zero", async () => {
      let sender = accounts[11];
      let spender = accounts[12];
      await tokenInstance.mint(sender, 10, {from: minter});
      await tokenInstance.approve(spender, 10, {from: sender});
      await truffleAssert.reverts(
        tokenInstance.transferFrom(sender, zero_address, 10, {from: spender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("cannot transferFrom with amount is not a natural number", async () => {
      let sender = accounts[1];
      let recipient = accounts[2];
      let spender = accounts[3];
      await tokenInstance.mint(sender, 10, {from: minter});
      await tokenInstance.approve(spender, 10, {from: sender});

      await truffleAssert.reverts(
        tokenInstance.transferFrom(sender, recipient, 0, {from: spender}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });
  });

  describe('Test burn function', function() {
    beforeEach(initialize);
    
    it("burn success case", async () => {
      let burn_account = accounts[11];
      await tokenInstance.mint(burn_account, 10, {from: minter});
      let burn_tx = await tokenInstance.burn(5, {from: burn_account});
      await truffleAssert.eventEmitted(burn_tx, 'Burn', (ev) => {
        return ev.burnee === burn_account && ev.amount.toNumber() === 5 && ev.sender === burn_account;
      }, 'Burn event should be emitted with correct parameters');
      balance = await tokenInstance.balanceOf(burn_account);
      assert.strictEqual(balance.toNumber(), 5, "Balance of recipient not correct!");
    });

    it("burn should change the totalSupply", async () => {
      let burn_account = accounts[11];
      await tokenInstance.mint(burn_account, 10, {from: minter});
      let old_totalSupply = await tokenInstance.totalSupply();
      await tokenInstance.burn(5, {from: burn_account});
      let new_totalSupply = await tokenInstance.totalSupply();
      assert.strictEqual(old_totalSupply.toNumber() - 5, new_totalSupply.toNumber(), "totalSupply not change after burn!");
    });

    it("burn exceed the balance of account should fail", async () => {
      let burn_account = accounts[11];
      await tokenInstance.mint(burn_account, 10, {from: minter});
      await truffleAssert.reverts(
        tokenInstance.burn(11, {from: burn_account}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("burn exceed the balance of account should fail", async () => {
      let burn_account = accounts[11];
      await tokenInstance.mint(burn_account, 10, {from: minter});
      await tokenInstance.burn(9, {from: burn_account});
      await truffleAssert.reverts(
        tokenInstance.burn(2, {from: burn_account}),
        truffleAssert.ErrorType.REVERT,
        'This should be a fail test case!'
      );
    });

    it("cannot burn amount of non natural number", async () => {
      let burn_account = accounts[11];
      await tokenInstance.mint(burn_account, 10, {from: minter});
      
      await truffleAssert.reverts(
        tokenInstance.burn(0, {from: burn_account}),
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
      let initial_allowance = await tokenInstance.allowance(approver, spender);
      assert.strictEqual(initial_allowance.toNumber(), 0, "Initial allowance not correct!");
    });

    it("approve should change the allowance", async () => {
      let approver = accounts[11];
      let spender = accounts[12];
      let old_allowance = await tokenInstance.allowance(approver, spender);
      await tokenInstance.mint(approver, 10, {from: minter});
      await tokenInstance.approve(spender, 9, {from: approver});
      let new_allowance = await tokenInstance.allowance(approver, spender);
      assert.strictEqual(old_allowance.toNumber() + 9, new_allowance.toNumber(), "Allowance after approve not correct!");
    });
  });
})
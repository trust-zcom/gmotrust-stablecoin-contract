# ZUSD/GYEN
GMO-Z.com Trust Company issued two stablecoins. One is Z.com USD (ZUSD) and the other is GMO JPY (GYEN). ZUSD is collateralized by U.S. Dollar and GYEN is collateralized by Japanese Yen.

## Contracts
ZUSD and GYEN are upgradable ERC20 tokens with features that ensure the tokens' security in minting, anti-money laundering, and emergency precautions.

### ERC20
The implementation of the ERC20 interface is based on OpenZeppelin. Therefore, we do not elaborate on technical details in this document.

#### Note
`approve()` and `transferFrom()` in ERC20 may cause a race condition. This race condition could cause loss of funds for the users that employ `approve()` and `transferFrom()`. Therefore, we recommend `increaseAllowance()` and `decreaseAllowance()`, which are non-standard ERC20 functions, instead of `approve()`.

### Stablecoin
There is no 1: 1 constraint with fiat currencies in terms of contract functionality, but we conduct 1: 1 constraint on Mint & Burn during our operation.
Customers can send the fiat currency fund to our partner bank account via ZUSD/GYEN purchase applications, which is maintained by GMO-Z.com Trust Company, Inc. We mint the same amount of token 1:1 with fiat currency fund they sent, then we transfer these tokens to their wallet addresses. Since they can send arbitrary fiat currency funds, arbitrary minting is necessary.
Customers can transfer tokens to their own addresses provided by GMO-Z.com Trust Company during the purchase applications. We burn tokens of theses addresses, then we send the same amount of fiat currency fund 1:1 with burned token amount to their bank accounts.

### Capacity
`capacity` is one of the safety features and it is the maximum value of `totalSupply`. `minter` cannot mint token amount that exceeds the `capacity`. By keeping `capacity` and `totalSupply` equal in amount, `capper` must change `capacity` before `minter` is able to mint tokens. `minter` cannot mint tokens if `capper` does not change `capacity` in advance. Also, `minter` and `capper` will be different and separate accounts. The private keys for `minter` and `capper` will be managed by different physical devices by different personnel. Therefore, tokens can be minted securely without malicious use.

### Prohibit
`prohibit` is the feature for Anti-Money Laundering (AML). `prohibiter` can prohibit users from transferring tokens for money laundering purposes.

### Pause
`pause` is the feature for emergency situations. When `pauser` pauses the token, all transactions of the token will fail.

### Account management
All keys such as minter and capper must be changeable. In case of the incidents that keys are leaked or used maliciously, we can change the keys not only as a countermeasure in the event of key leakage are necessary, but also as a measure to mitigate risks. Therefore, all accounts must be changeable for above security reasons and follow the rules as follows. `admin` can change `capper`, `prohibiter` and `pauser`; `minterAdmin` can change `minter`. Since `admin` and `minterAdmin` must be changeable as well, `owner`, which is kept very strictly, can change `admin` and `minterAdmin`.

### Upgrade contracts
ZUSD.sol and GYEN.sol are proxy contracts and Token_v1.sol is an implementation contract. The implementations of proxy contracts are based on OpenZeppelin. Therefore, we do not elaborate on technical details for them.
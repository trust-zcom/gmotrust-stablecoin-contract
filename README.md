# GMO-Z.com Trust Company, Inc. Fiat Tokens

The GMO Trust token is an ERC-20 compatible smart contract. It allows minting, burning, pausing (of activity), freezing (of an individual address), and upgrading the contract with new features or to fix bugs.

The smart contract is used to issue two stablecoins — GYEN is backed 1:1 by JPY and ZUSD is backed 1:1 by USD. You can learn more about fiat reserves, minting of new tokens, etc. in our [FAQ](https://stablecoin.z.com/).

## Stablecoin

There is no 1:1 constraint with fiat currencies in terms of the contract functionality, but we conduct 1:1 constraint on Mint & Burn during our operation. Customers can send the fiat currency fund to our partner bank account via ZUSD/GYEN purchase requests, maintained by GMO Trust.

We mint the same amount of tokens 1:1 with fiat currency fund customers sent, which will then be transferred to the wallet addresses customers provided. Since customers can send arbitrary fiat currency funds, arbitrary minting is necessary.

When we burn tokens upon customers' redemption requests, we send the same amount of fiat currency fund 1:1 with the burned token amount to customers' bank accounts. 

Customers can burn tokens by calling `burn()` themselves, however, they will not receive the underlying fiat currencies in such case.

## Roles

Each role (address) is used to control specific feature(s):

- `owner` - performs `admin` and `minterAdmin` assignments, and reassigns itself.
- `admin` - assigns `capper`, `prohibiter`, `pauser`, and `wiper` roles.
- `capper` - sets the minting capacity (allowance) available to `minter`. 
- `prohibiter` - can prohibit users (addresses) from transferring tokens in accordance with Anti-Money Laundering (AML) procedures.
- `pauser` - can pause and unpause transfers (and other actions) for the entire contract.
- `wiper` - can wipe out the balance of an address upon instructions from law enforcement agencies.
- `minterAdmin` - can assign `minter`.
- `minter` - mints the tokens.

## ERC-20

The implementation of the contract interface is based on the OpenZeppelin framework.

The standard ERC-20 `approve()` and `transferFrom()` might cause a race condition which could result in a loss of funds for users that employ these two functions. Therefore, we recommend using `increaseAllowance()` and `decreaseAllowance()` instead of `approve()`.

## Minting and Burning

`capacity` is one of the safety features and it represents the current maximum value allowed for `totalSupply`.

`minter` cannot mint tokens in the amount that would exceed the `capacity`.

`capper` is responsible to set / increase the `capacity` as to enable the `minter` to be able to mint tokens.

`minter` and `capper` are separate accounts. Their keys are managed on different physical devices and by different personnel, to ensure maximum security. 

End users can burn tokens by calling `burn()` themselves — in such a case the end user would not receive the funds from the fiat reserve.

## Prohibit

`prohibit` is a security feature implemented for the purpose of Anti-Money Laundering (AML) activities. `prohibiter` can prevent specific end users (addresses) from performing token transactions.

## Pausing

`pause` is a security feature intended for use in emergencies. While the `pauser` pauses the token, all transactions (except `changeAdmin()`, the reassignment of `admin` and `changePauser`, reassignment of `pauser`) are stopped and will fail.

## Wipe

`wipe` is another security feature. `wiper` can wipe out the balance of an address upon instructions from law enforcement agencies. In such cases, the underlying fiat currency will be handled according to law enforcement’s instructions.

## Upgrading

ZUSD.sol and GYEN.sol are proxy contracts and Token_v1.sol is an implementation contract. The proxy contracts are based on the OpenZeppelin framework.

When an upgrade is needed, a new implementation contact (Token_v2.sol, Token_v3.sol, etc.) can be deployed and the proxy is updated to point to it.

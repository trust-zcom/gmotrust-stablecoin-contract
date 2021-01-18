pragma solidity 0.5.8;

import "@openzeppelin/upgrades/contracts/upgradeability/AdminUpgradeabilityProxy.sol";

contract GYEN is AdminUpgradeabilityProxy {

    constructor(address _logic, address _admin, bytes memory _data) public payable AdminUpgradeabilityProxy(_logic, _admin, _data) {}

}
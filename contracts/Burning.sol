pragma solidity 0.5.8;

import "./BurningFactory.sol";
import "./Token_v3.sol";

/**
 * Burning is the contract for management of ZUSD/GYEN.
 */
contract Burning {
    address public factory;

    constructor() public {
        factory = msg.sender;
    }

    modifier onlyBurner {
        require(msg.sender == BurningFactory(factory).burner(), "the sender is not the burner");
        _;
    }

    function burn(address _tokenAddress, uint256 _amount) public onlyBurner {
        Token_v3(_tokenAddress).burn(_amount);
    }

    function transfer(address _tokenAddress, address _recipient, uint256 _amount) public onlyBurner {
        require(Token_v3(_tokenAddress).transfer(_recipient, _amount), "Transfer is failed");
    }
}
pragma solidity 0.5.8;

import "./Burning.sol";

/**
 * BurningFactory is the contract for management of ZUSD/GYEN.
 */
contract BurningFactory {
    address public manager;
    address public burner;

    event BurnerChanged(address indexed oldBurner, address indexed newBurner, address indexed sender);
    event Deployed(address indexed burning, address indexed sender);

    constructor(address _manager, address _burner) public {
        require(_manager != address(0), "_manager is the zero address");
        require(_burner != address(0), "_burner is the zero address");
        manager = _manager;
        burner = _burner;

        emit BurnerChanged(address(0), burner, msg.sender);
    }

    modifier onlyBurner() {
        require(msg.sender == burner, "the sender is not the burner");
        _;
    }

    modifier onlyManager() {
        require(msg.sender == manager, "the sender is not the manager");
        _;
    }

    function deploy() public onlyBurner {
        Burning burning = new Burning();
        emit Deployed(address(burning), msg.sender);
    }

    function changeBurner(address _account) public onlyManager {
        require(_account != address(0), "this account is the zero address");

        address old = burner;
        burner = _account;
        emit BurnerChanged(old, burner, msg.sender);
    }
}
const BurningFactory = artifacts.require("BurningFactory");

module.exports = function(deployer) {
  const config = require(`../config/${deployer.network}.json`);
  
  deployer.deploy(BurningFactory, config.burning_factory_manager, config.burner);
};

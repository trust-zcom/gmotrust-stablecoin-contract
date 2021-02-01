const validateStorageSlots = require("./validate_storage_slots_helper.js");
const GYEN = artifacts.require("GYEN");
const ZUSD = artifacts.require("ZUSD");

contract("Upgrade GYEN/ZUSD from v1 to v2", (accounts) => {

  validateStorageSlots(
    GYEN,
    1,
    accounts,
  );


  validateStorageSlots(
    GYEN,
    2,
    accounts,
  );

  validateStorageSlots(
    ZUSD,
    1,
    accounts,
  );


  validateStorageSlots(
    ZUSD,
    2,
    accounts,
  );  
});
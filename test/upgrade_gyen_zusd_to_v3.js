const validateStorageSlots = require("./validate_storage_slots_helper.js");
const GYEN = artifacts.require("GYEN");
const ZUSD = artifacts.require("ZUSD");

contract("Upgrade GYEN/ZUSD from v2 to v3", (accounts) => {

  validateStorageSlots(
    GYEN,
    3,
    accounts,
  );

  validateStorageSlots(
    ZUSD,
    3,
    accounts,
  );
});
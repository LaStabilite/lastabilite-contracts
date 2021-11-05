//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "../interfaces/IMobiusMinter.sol";

contract MockMobiusMinter is IMobiusMinter, ERC20 {
  constructor() ERC20("Mock", "MOCK") {}

  function mint(address) external override {
    _mint(msg.sender, 42);
  }

  function token(address) external view override returns (address) {
    return address(this);
  }
}

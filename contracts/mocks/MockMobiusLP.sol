//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "../interfaces/IMobiusSwap.sol";

contract MockMobiusLP is IMobiusSwap, ERC20 {
  uint256 virtualPrice = 1 ether;

  constructor() ERC20("Mock", "MOCK") {
    _mint(msg.sender, 100 ether);
  }

  function getVirtualPrice() external view override returns (uint256) {
    return virtualPrice;
  }

  function setVirtualPrice(uint256 _virtualPrice) external {
    virtualPrice = _virtualPrice;
  }
}

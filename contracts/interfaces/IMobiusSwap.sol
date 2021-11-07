//SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

interface IMobiusSwap {
  function getVirtualPrice() external view returns (uint256);
}

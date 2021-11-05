//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IMobiusMinter {
  function mint(address gaugeAddress) external;

  function token(address gaugeAddress) external view returns (address);
}

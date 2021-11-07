//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IMobiusLPGauge {
  function lp_token() external view returns (address);

  function deposit(uint256 value) external;

  function withdraw(uint256 value) external;

  function claim_rewards(address rewardsRecipient) external;
}

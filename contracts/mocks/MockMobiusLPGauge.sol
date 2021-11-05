//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../interfaces/IMobiusLPGauge.sol";
import "./MockToken.sol";

contract MockMobiusLPGauge is IMobiusLPGauge, ERC20 {
  using SafeERC20 for IERC20;

  IERC20 public immutable lpToken;
  IERC20[2] public rewardTokens;

  constructor(IERC20 _lpToken) ERC20("Mock", "MOCK") {
    lpToken = _lpToken;
    rewardTokens = [new MockToken(), new MockToken()];
  }

  function lp_token() external view override returns (address) {
    return address(lpToken);
  }

  function deposit(uint256 value, address onBehalfOf) external override {
    lpToken.safeTransferFrom(msg.sender, address(this), value);
    _mint(onBehalfOf, value);
  }

  function withdraw(uint256 value) external override {
    _burn(msg.sender, value);
    lpToken.safeTransfer(msg.sender, value);
  }

  function claim_rewards(address rewardsRecipient) external override {
    rewardTokens[0].safeTransfer(rewardsRecipient, 1);
    rewardTokens[1].safeTransfer(rewardsRecipient, 1);
  }
}

//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "../interfaces/IMobiusSwap.sol";
import "../interfaces/IMobiusLPGauge.sol";
import "../interfaces/IMobiusMinter.sol";

contract MobiusVault is ERC20, Ownable, ReentrancyGuard {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  IMobiusMinter public immutable mobiMinter;
  IMobiusLPGauge public immutable lpGauge;
  IMobiusSwap public immutable lpSwap;
  IERC20 public immutable lp;

  address public rewardRecipient;

  event RewardRecipientChanged(
    address previousRewardRecipient,
    address nextRewardRecipeint
  );
  event RewardRedeemed(address token, uint256 amount);

  constructor(
    string memory _tokenName,
    string memory _tokenSymbol,
    IMobiusMinter _mobiMinter,
    IMobiusLPGauge _lpGauge,
    IMobiusSwap _lpSwap,
    address _rewardRecipient
  ) ERC20(_tokenName, _tokenSymbol) {
    mobiMinter = _mobiMinter;
    lpGauge = _lpGauge;
    lpSwap = _lpSwap;
    lp = IERC20(_lpGauge.lp_token());
    rewardRecipient = _rewardRecipient;
  }

  // ==== PERMISSIONED WRITE FUNCTIONS ====

  function setRewardRecipient(address newRewardRecipient) external onlyOwner {
    emit RewardRecipientChanged(rewardRecipient, newRewardRecipient);
    rewardRecipient = newRewardRecipient;
  }

  // ==== UNPERMISSIONED WRITE FUNCTIONS ====

  function claimRewards() external nonReentrant {
    // Claim MOBI
    mobiMinter.mint(address(lpGauge));
    lpGauge.claim_rewards(address(this));
  }

  function redeemReward(IERC20 token) external nonReentrant {
    if (address(token) == address(lpGauge)) {
      uint256 lockedValue = IERC20(address(lpGauge))
        .balanceOf(address(this))
        .mul(lpSwap.getVirtualPrice())
        .div(1 ether);
      // ((total - locked) / total) * locked
      uint256 redeemable = lockedValue
        .sub(totalSupply())
        .mul(totalSupply())
        .div(lockedValue);
      lpGauge.withdraw(redeemable);
      IERC20(address(lp)).safeTransfer(rewardRecipient, redeemable);
      emit RewardRedeemed(address(token), redeemable);
    } else {
      uint256 redeemable = token.balanceOf(address(this));
      token.safeTransfer(rewardRecipient, redeemable);
      emit RewardRedeemed(address(token), redeemable);
    }
  }

  /// @notice Mints vault tokens
  /// @param _depositAmount The amount of vault tokens to collateralize
  /// @param _onBehalfOf The recipient of the minted tokens
  function deposit(uint256 _depositAmount, address _onBehalfOf)
    external
    nonReentrant
  {
    IERC20(address(lp)).safeTransferFrom(
      msg.sender,
      address(this),
      _depositAmount
    );
    require(
      IERC20(address(lp)).approve(address(lpGauge), _depositAmount),
      "Approve for lpGauge deposit failed"
    );
    lpGauge.deposit(_depositAmount);
    uint256 mintAmount = _depositAmount.mul(lpSwap.getVirtualPrice()).div(
      1 ether
    );
    _mint(_onBehalfOf, mintAmount);
  }

  /// @notice Burns vault tokens
  /// @param _burnAmount The amount of vault tokens to redeem. Equal to amount of LITÉ to burn
  /// @param _to The recipient of the vault tokens
  function withdraw(uint256 _burnAmount, address _to) external nonReentrant {
    _burn(msg.sender, _burnAmount);
    uint256 withdrawAmount = _burnAmount.mul(1 ether).div(
      lpSwap.getVirtualPrice()
    );
    lpGauge.withdraw(withdrawAmount);
    IERC20(address(lp)).safeTransfer(_to, withdrawAmount);
  }
}

//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Stabilite is ERC20, Ownable, ReentrancyGuard {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  mapping(address => bool) public vaults;
  mapping(address => uint256) public depositLimits;

  event VaultWhitelisted(address indexed vault);
  event VaultBanned(address indexed vault);
  event VaultDepositLimitChanged(
    address indexed vault,
    uint256 previousDepositLimit,
    uint256 nextDepositLimit
  );

  constructor(string memory _tokenName, string memory _tokenSymbol)
    ERC20(_tokenName, _tokenSymbol)
  {}

  // ==== PERMISSIONED WRITE FUNCTIONS ====

  function whitelistVault(address _vault) external onlyOwner {
    vaults[_vault] = true;
    emit VaultWhitelisted(_vault);
  }

  function banVault(address _vault) external onlyOwner {
    vaults[_vault] = false;
    emit VaultBanned(_vault);
  }

  function setDepositLimit(address _vault, uint256 _newDepositLimit)
    external
    onlyOwner
  {
    emit VaultDepositLimitChanged(
      _vault,
      depositLimits[_vault],
      _newDepositLimit
    );
    depositLimits[_vault] = _newDepositLimit;
  }

  // ==== UNPERMISSIONED WRITE FUNCTIONS ====

  /// @notice Mints LITÉ tokens
  /// @param _vault The vault to collateralize with
  /// @param _mintAmount The amount of vault tokens to collateralize. Equal to amount of tokens to mint
  /// @param _onBehalfOf The recipient of the minted tokens
  function mint(
    IERC20 _vault,
    uint256 _mintAmount,
    address _onBehalfOf
  ) external nonReentrant {
    require(vaults[address(_vault)], "Vault is not whitelisted");
    require(
      _vault.balanceOf(address(this)).add(_mintAmount) <=
        depositLimits[address(_vault)],
      "Mint amount exceeds deposit limit"
    );
    _vault.safeTransferFrom(msg.sender, address(this), _mintAmount);
    _mint(_onBehalfOf, _mintAmount);
  }

  /// @notice Burns LITÉ tokens
  /// @param _vault The vault to redeem
  /// @param _burnAmount The amount of vault tokens to redeem. Equal to amount of LITÉ to burn
  /// @param _to The recipient of the vault tokens
  function burn(
    IERC20 _vault,
    uint256 _burnAmount,
    address _to
  ) external nonReentrant {
    require(vaults[address(_vault)], "Vault is not whitelisted");
    require(
      _vault.balanceOf(address(this)) >= _burnAmount,
      "Burn amount exceeds vault reserve"
    );
    _burn(msg.sender, _burnAmount);
    _vault.safeTransfer(_to, _burnAmount);
  }
}

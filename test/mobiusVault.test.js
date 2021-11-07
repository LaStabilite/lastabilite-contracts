/* global artifacts, web3, contract */
require("chai")
  .use(require("bn-chai")(web3.utils.BN))
  .use(require("chai-as-promised"))
  .should();

const { toWei } = require("web3-utils");
const ERC20 = artifacts.require("ERC20");
const MobiusVault = artifacts.require("MobiusVault");
const MobiusMinter = artifacts.require("MockMobiusMinter");
const MobiusLP = artifacts.require("MockMobiusLP");
const MobiusLPGauge = artifacts.require("MockMobiusLPGauge");

contract("MobiusVault", (accounts) => {
  const [sender, rewardRecipient, other] = accounts;
  const amount = 1000;
  let mobi, lpToken, lpGauge, rewardToken0, rewardToken1, vault;

  before(async () => {
    mobi = await MobiusMinter.new();
    lpToken = await MobiusLP.new();
    lpGauge = await MobiusLPGauge.new(lpToken.address);
    rewardToken0 = await ERC20.at(await lpGauge.rewardTokens(0));
    rewardToken1 = await ERC20.at(await lpGauge.rewardTokens(1));
    vault = await MobiusVault.new(
      "Mobius ULP Vault",
      "mobiVAULT",
      mobi.address,
      lpGauge.address,
      lpToken.address, // Stands in as lpSwap
      rewardRecipient
    );
  });

  describe("#constructor", () => {
    it("should initialize correctly", async () => {
      (await vault.rewardRecipient()).should.be.equal(rewardRecipient);
    });
  });

  describe("#setRewardRecipient", () => {
    it("should fail when caller is not the owner", async () => {
      await vault
        .setRewardRecipient(other, { from: other })
        .should.be.rejectedWith("Ownable: caller is not the owner");
      (await vault.rewardRecipient()).should.be.equal(rewardRecipient);
    });

    it("should succeed when caller is the owner", async () => {
      await vault.setRewardRecipient(other);
      (await vault.rewardRecipient()).should.be.equal(other);
      await vault.setRewardRecipient(rewardRecipient);
      (await vault.rewardRecipient()).should.be.equal(rewardRecipient);
    });
  });

  describe("#claimRewards", () => {
    it("should work", async () => {
      const mobiBalanceBefore = await mobi.balanceOf(vault.address);
      const rewardToken0BalanceBefore = await rewardToken0.balanceOf(
        vault.address
      );
      const rewardToken1BalanceBefore = await rewardToken1.balanceOf(
        vault.address
      );
      await vault.claimRewards();
      const mobiBalanceAfter = await mobi.balanceOf(vault.address);
      const rewardToken0BalanceAfter = await rewardToken0.balanceOf(
        vault.address
      );
      const rewardToken1BalanceAfter = await rewardToken1.balanceOf(
        vault.address
      );

      mobiBalanceAfter.sub(mobiBalanceBefore).should.be.eq.BN(42);
      rewardToken0BalanceAfter
        .sub(rewardToken0BalanceBefore)
        .should.be.eq.BN(1);
      rewardToken1BalanceAfter
        .sub(rewardToken1BalanceBefore)
        .should.be.eq.BN(1);
    });
  });

  describe("#deposit", () => {
    it("should work", async () => {
      await lpToken.approve(vault.address, amount);
      const lpTokenBalanceBefore = await lpToken.balanceOf(sender);
      let vaultBalanceBefore = await vault.balanceOf(sender);
      await vault.deposit(amount, sender);
      const lpTokenBalanceAfter = await lpToken.balanceOf(sender);
      let vaultBalanceAfter = await vault.balanceOf(sender);

      lpTokenBalanceBefore.sub(lpTokenBalanceAfter).should.be.eq.BN(amount);
      vaultBalanceAfter.sub(vaultBalanceBefore).should.be.eq.BN(amount);
    });
  });

  describe("#redeemReward", () => {
    it("should work", async () => {
      // Quadruple the virtual price
      await lpToken.setVirtualPrice(toWei("4"));

      // Redeem LP
      const lpTokenBalanceBefore = await lpToken.balanceOf(rewardRecipient);
      await vault.redeemReward(lpGauge.address);
      const lpTokenBalanceAfter = await lpToken.balanceOf(rewardRecipient);

      lpTokenBalanceAfter
        .sub(lpTokenBalanceBefore)
        .should.be.eq.BN((amount * 3) / 4);

      // Redeem rewardToken0
      const rewardToken0BalanceBefore = await rewardToken0.balanceOf(
        rewardRecipient
      );
      await vault.redeemReward(rewardToken0.address);
      const rewardToken0BalanceAfter = await rewardToken0.balanceOf(
        rewardRecipient
      );
      rewardToken0BalanceAfter
        .sub(rewardToken0BalanceBefore)
        .should.be.eq.BN(1);

      // Redeem rewardToken1
      const rewardToken1BalanceBefore = await rewardToken1.balanceOf(
        rewardRecipient
      );
      await vault.redeemReward(rewardToken1.address);
      const rewardToken1BalanceAfter = await rewardToken1.balanceOf(
        rewardRecipient
      );
      rewardToken1BalanceAfter
        .sub(rewardToken1BalanceBefore)
        .should.be.eq.BN(1);
    });
  });

  describe("#withdraw", () => {
    it("should work", async () => {
      const lpTokenBalanceBefore = await lpToken.balanceOf(sender);
      let vaultBalanceBefore = await vault.balanceOf(sender);
      await vault.withdraw(amount, sender);
      const lpTokenBalanceAfter = await lpToken.balanceOf(sender);
      let vaultBalanceAfter = await vault.balanceOf(sender);

      lpTokenBalanceAfter.sub(lpTokenBalanceBefore).should.be.eq.BN(amount / 4);
      vaultBalanceBefore.sub(vaultBalanceAfter).should.be.eq.BN(amount);
    });
  });
});

/* global artifacts, web3, contract */
require("chai")
  .use(require("bn-chai")(web3.utils.BN))
  .use(require("chai-as-promised"))
  .should();

const Stabilite = artifacts.require("Stabilite");
const MockVault = artifacts.require("MockVault");

contract("Stabilite", (accounts) => {
  const [sender, other] = accounts;
  const depositLimit = 1000;
  const amount = 1000;
  let vault1, vault2, vault3, stabilite;

  before(async () => {
    vault1 = await MockVault.new();
    vault2 = await MockVault.new();
    vault3 = await MockVault.new();
    stabilite = await Stabilite.new("Stabilite MOCK", "litMOCK");
  });

  describe("#constructor", () => {
    it("should initialize correctly", async () => {
      (await stabilite.vaults(vault1.address)).should.be.equal(false);
      (await stabilite.vaults(vault2.address)).should.be.equal(false);
    });
  });

  describe("#whitelistVault", () => {
    it("should fail when caller is not the owner", async () => {
      await stabilite
        .whitelistVault(vault1.address, { from: other })
        .should.be.rejectedWith("Ownable: caller is not the owner");
      (await stabilite.vaults(vault1.address)).should.be.equal(false);
      (await stabilite.vaults(vault2.address)).should.be.equal(false);
    });

    it("should succeed when caller is the owner", async () => {
      await stabilite.whitelistVault(vault1.address);
      (await stabilite.vaults(vault1.address)).should.be.equal(true);
      await stabilite.whitelistVault(vault2.address);
      (await stabilite.vaults(vault2.address)).should.be.equal(true);
    });
  });

  describe("#banVault", () => {
    it("should fail when caller is not the owner", async () => {
      await stabilite
        .banVault(vault1.address, { from: other })
        .should.be.rejectedWith("Ownable: caller is not the owner");
      (await stabilite.vaults(vault1.address)).should.be.equal(true);
      (await stabilite.vaults(vault2.address)).should.be.equal(true);
    });

    it("should succeed when caller is the owner", async () => {
      await stabilite.banVault(vault1.address);
      (await stabilite.vaults(vault1.address)).should.be.equal(false);
      await stabilite.banVault(vault2.address);
      (await stabilite.vaults(vault2.address)).should.be.equal(false);

      // Revert
      await stabilite.whitelistVault(vault1.address);
      await stabilite.whitelistVault(vault2.address);
    });
  });

  describe("#setDepositLimit", () => {
    it("should fail when caller is not the owner", async () => {
      await stabilite
        .setDepositLimit(vault1.address, depositLimit, { from: other })
        .should.be.rejectedWith("Ownable: caller is not the owner");
      (await stabilite.depositLimits(vault1.address)).should.be.eq.BN(0);
      (await stabilite.depositLimits(vault2.address)).should.be.eq.BN(0);
    });

    it("should succeed when caller is the owner", async () => {
      await stabilite.setDepositLimit(vault1.address, depositLimit);
      (await stabilite.depositLimits(vault1.address)).should.be.eq.BN(
        depositLimit
      );
      await stabilite.setDepositLimit(vault2.address, depositLimit);
      (await stabilite.depositLimits(vault2.address)).should.be.eq.BN(
        depositLimit
      );
    });
  });

  describe("#mint", () => {
    it("should fail for non-whitelisted vault", async () => {
      // Mint with vault3
      await stabilite
        .mint(vault3.address, amount, sender)
        .should.be.rejectedWith("Vault is not whitelisted");
    });

    it("should work", async () => {
      // Mint with vault1
      await vault1.approve(stabilite.address, amount);
      const vault1BalanceBefore = await vault1.balanceOf(sender);
      let stabiliteBalanceBefore = await stabilite.balanceOf(sender);
      await stabilite.mint(vault1.address, amount, sender);
      const vault1BalanceAfter = await vault1.balanceOf(sender);
      let stabiliteBalanceAfter = await stabilite.balanceOf(sender);

      vault1BalanceBefore.sub(vault1BalanceAfter).should.be.eq.BN(amount);
      stabiliteBalanceAfter.sub(stabiliteBalanceBefore).should.be.eq.BN(amount);

      // Mint with vault2
      await vault2.approve(stabilite.address, amount);
      const vault2BalanceBefore = await vault2.balanceOf(sender);
      stabiliteBalanceBefore = await stabilite.balanceOf(sender);
      await stabilite.mint(vault2.address, amount, sender);
      const vault2BalanceAfter = await vault2.balanceOf(sender);
      stabiliteBalanceAfter = await stabilite.balanceOf(sender);

      vault2BalanceBefore.sub(vault2BalanceAfter).should.be.eq.BN(amount);
      stabiliteBalanceAfter.sub(stabiliteBalanceBefore).should.be.eq.BN(amount);
    });

    it("should fail for trying to exceed the deposit limit", async () => {
      await stabilite
        .mint(vault1.address, 1, sender)
        .should.be.rejectedWith("Mint amount exceeds deposit limit");
      await stabilite
        .mint(vault2.address, 1, sender)
        .should.be.rejectedWith("Mint amount exceeds deposit limit");
    });
  });

  describe("#burn", () => {
    it("should fail for non-whitelisted vault", async () => {
      // Burn with vault3
      await vault3.transfer(stabilite.address, amount);
      await stabilite
        .burn(vault3.address, amount, sender)
        .should.be.rejectedWith("Vault is not whitelisted");
    });

    it("should fail for trying to exceed the vault reserve", async () => {
      await stabilite
        .burn(vault1.address, amount + 1, sender)
        .should.be.rejectedWith("Burn amount exceeds vault reserve");
      await stabilite
        .burn(vault2.address, amount + 1, sender)
        .should.be.rejectedWith("Burn amount exceeds vault reserve");
    });

    it("should work", async () => {
      // Burn with vault1
      const vault1BalanceBefore = await vault1.balanceOf(sender);
      let stabiliteBalanceBefore = await stabilite.balanceOf(sender);
      await stabilite.burn(vault1.address, amount, sender);
      const vault1BalanceAfter = await vault1.balanceOf(sender);
      let stabiliteBalanceAfter = await stabilite.balanceOf(sender);

      vault1BalanceAfter.sub(vault1BalanceBefore).should.be.eq.BN(amount);
      stabiliteBalanceBefore.sub(stabiliteBalanceAfter).should.be.eq.BN(amount);

      // Burn with vault2
      const vault2BalanceBefore = await vault2.balanceOf(sender);
      stabiliteBalanceBefore = await stabilite.balanceOf(sender);
      await stabilite.burn(vault2.address, amount, sender);
      const vault2BalanceAfter = await vault2.balanceOf(sender);
      stabiliteBalanceAfter = await stabilite.balanceOf(sender);

      vault2BalanceAfter.sub(vault2BalanceBefore).should.be.eq.BN(amount);
      stabiliteBalanceBefore.sub(stabiliteBalanceAfter).should.be.eq.BN(amount);
    });
  });
});

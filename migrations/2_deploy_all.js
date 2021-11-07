const STAB = artifacts.require("STAB");
const Stabilite = artifacts.require("Stabilite");
const MobiusVault = artifacts.require("MobiusVault");

module.exports = function (deployer, network) {
  if (network === "celo") {
    // deployer.deploy(STAB);
    // deployer.deploy(Stabilite, "Stabilite USD", "stabUSD");
    deployer.deploy(
      MobiusVault,
      "MobLP USDC/cUSD Vault",
      "mobVAULT",
      "0x5f0200ca03196d5b817e2044a0bb0d837e0a7823", // MOBI Minter
      "0xdaa2ab880b7f3d5697e6f85e63c28b9120aa9e07", // LP Gauge
      "0xA5037661989789d0310aC2B796fa78F1B01F195D", // LP Swap
      "0xf1d10a171fF8C269882f132803c64e5dcC12875F" // RewardsRecipient
    );
  }
};

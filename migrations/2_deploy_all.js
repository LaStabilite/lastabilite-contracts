const STABIL = artifacts.require("STABIL");
const Stabilite = artifacts.require("Stabilite");
const MobiusVault = artifacts.require("MobiusVault");

module.exports = function (deployer, network) {
  if (network === "celo") {
    // deployer.deploy(Stabilite, "Stabilite USD", "stabilUSD");
    // deployer.deploy(
    //   MobiusVault,
    //   "MobLP USDC/cUSD Vault",
    //   "mobVAULT",
    //   "0x5f0200ca03196d5b817e2044a0bb0d837e0a7823", // MOBI Minter
    //   "0xdaa2ab880b7f3d5697e6f85e63c28b9120aa9e07", // LP Gauge
    //   "0xA5037661989789d0310aC2B796fa78F1B01F195D", // LP Swap
    //   "0x63479641B608324Bb33A80D2cD2B6Ff42B0A4C08" // RewardsRecipient
    // );
    deployer.deploy(
      MobiusVault,
      "MobLP cUSD/asUSDC Vault",
      "mobVAULT",
      "0x5f0200ca03196d5b817e2044a0bb0d837e0a7823", // MOBI Minter
      "0x27D9Bfa5F864862BeDC23cFab7e00b6b94488CC6", // LP Gauge
      "0x63C1914bf00A9b395A2bF89aaDa55A5615A3656e", // LP Swap
      "0x63479641B608324Bb33A80D2cD2B6Ff42B0A4C08" // RewardsRecipient
    );
  }
};

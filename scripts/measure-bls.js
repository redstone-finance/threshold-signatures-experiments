const hre = require("hardhat");

const { getBlsInputs } = require("../utils/utils.js");

async function measureGas(numSigners, numTotal) {
  const BlsSignatureTest = await hre.ethers.getContractFactory("BlsSignatureTest");
  const verifier = await BlsSignatureTest.deploy();
  await verifier.deployed();

  const {
    aggregatedPublicKey,
    partPublicKey,
    message,
    partSignature,
    signersBitmask } = await getBlsInputs(32, numSigners, numTotal);

  const tx = await verifier.verifyMultisignature(
    `0x${aggregatedPublicKey}`,
    `0x${partPublicKey}`,
    `0x${message}`,
    `0x${partSignature}`,
    `0x${signersBitmask}`);

  const receipt = await tx.wait();
  console.log(receipt.gasUsed.toNumber());
}

async function main() {
  for (let i = 1; i <= 16; i++) {
    await measureGas(i, 16);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

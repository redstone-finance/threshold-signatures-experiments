const hre = require("hardhat");

const { randomSigners, getMessageDigestBytes, getSignaturesAndMask } = require("../utils/utils.js");

async function measureGas(numSigners, numTotal) {
  const signers = randomSigners(numTotal);
  const addresses = signers.map(signer => signer.address);

  const ECDSAVerifier = await hre.ethers.getContractFactory("ECDSAVerifier");
  const verifier = await ECDSAVerifier.deploy(addresses, numSigners);
  await verifier.deployed();

  const messageDigestBytes = getMessageDigestBytes();
  const [vs, rs, ss, mask] = await getSignaturesAndMask(signers, numSigners, messageDigestBytes);

  const result = await verifier.verifyAndMutate(messageDigestBytes, mask, vs, rs, ss);
  const receipt = await result.wait();

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

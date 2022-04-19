const hre = require("hardhat");

async function main() {
  const signers = await hre.ethers.getSigners();
  // Arbitrary.
  const oracleSigner = signers[0];

  const Verifier = await hre.ethers.getContractFactory("Verifier");
  const verifier = await Verifier.deploy(oracleSigner.address);

  await verifier.deployed();

  await hre.tenderly.persistArtifacts({
    name: "Verifier",
    address: verifier.address
  });

  console.log("Verifier deployed to:", verifier.address);

  // Sign and verify.
  const message = "Redstone oracles are awesome!";

  const messageDigest = hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes(message));
  const messageDigestBytes = hre.ethers.utils.arrayify(messageDigest);

  const signature = await oracleSigner.signMessage(messageDigestBytes);
  const signatureSplit = hre.ethers.utils.splitSignature(signature);

  console.log("The signature is: ", signature);

  const ok = await verifier.verifyHash(
    messageDigestBytes, signatureSplit.v, signatureSplit.r, signatureSplit.s);

  if (ok) {
    console.log("Validation successful!");
  } else {
    console.log("ERROR: Validation failed :(");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

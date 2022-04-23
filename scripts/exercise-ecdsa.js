const hre = require("hardhat");

async function main() {
  const signers = await hre.ethers.getSigners();
  // Arbitrary.
  const oracleSigner = signers[0];

  const ECDSAVerifier = await hre.ethers.getContractFactory("ECDSAVerifier");
  const verifier = await ECDSAVerifier.deploy(oracleSigner.address);

  await verifier.deployed();

  await hre.tenderly.persistArtifacts({
    name: "ECDSAVerifier",
    address: verifier.address
  });

  console.log("ECDSAVerifier deployed to:", verifier.address);

  // Sign and verify.
  const message = "Redstone oracles are awesome!";

  const messageDigest = hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes(message));
  const messageDigestBytes = hre.ethers.utils.arrayify(messageDigest);

  const signature = await oracleSigner.signMessage(messageDigestBytes);
  const signatureSplit = hre.ethers.utils.splitSignature(signature);

  console.log("The signature is: ", signature);

  const ok = await verifier.verifyEip191Ecdsa(
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

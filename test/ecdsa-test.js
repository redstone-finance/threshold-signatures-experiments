const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ECDSAVerifier", function () {
  it("Should admit correct signatures", async function () {
    const signers = await hre.ethers.getSigners();
    // Arbitrary.
    const oracleSigner = signers[0];

    const ECDSAVerifier = await hre.ethers.getContractFactory("ECDSAVerifier");
    const verifier = await ECDSAVerifier.deploy(oracleSigner.address);
    await verifier.deployed();

    const message = "Redstone oracles are awesome!";

    const messageDigest = hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes(message));
    const messageDigestBytes = hre.ethers.utils.arrayify(messageDigest);

    const signature = await oracleSigner.signMessage(messageDigestBytes);
    const signatureSplit = hre.ethers.utils.splitSignature(signature);

    const ok = await verifier.callStatic.verifyEip191Ecdsa(
      messageDigestBytes, signatureSplit.v, signatureSplit.r, signatureSplit.s);

    console.log(ok);

    expect(ok).to.be.true;
  });
});

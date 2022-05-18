const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ECDSAVerifier", function () {
  const groupSizes = [
    // M out of N.
    [ 5, 8 ],
    [ 9, 16 ],
    [ 17, 32 ],
  ];

  function randomSigners(length) {
    let signers = [];
    for (let i = 0; i < length; i++) {
      signers.push(hre.ethers.Wallet.createRandom());
    }

    return signers;
  }

  function getMessageDigestBytes() {
    const message = "Redstone oracles are awesome!";
    const messageDigest = hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes(message));
    const messageDigestBytes = hre.ethers.utils.arrayify(messageDigest);
    
    return messageDigestBytes;
  }

  async function getSignaturesAndMask(allSigners, numSignatures, messageDigestBytes) {
    let signatures = await Promise.all(
      allSigners.slice(0, numSignatures).map(async signer => {
        let signature = await signer.signMessage(messageDigestBytes);
        return hre.ethers.utils.splitSignature(signature);
      }));

    let vs = signatures.map(s => s.v);
    let rs = signatures.map(s => s.r);
    let ss = signatures.map(s => s.s);

    let mask = allSigners.map((_, index) => index < numSignatures);

    return [vs, rs, ss, mask];
  }

  for ([threshold, total] of groupSizes) {
    it(`Should admit minimal quorum (${threshold} of ${total})`, async function () {
      const signers = randomSigners(total);
      const addresses = signers.map(signer => signer.address);

      const ECDSAVerifier = await hre.ethers.getContractFactory("ECDSAVerifier");
      const verifier = await ECDSAVerifier.deploy(addresses, threshold);
      await verifier.deployed();

      const messageDigestBytes = getMessageDigestBytes();
      const [vs, rs, ss, mask] = await getSignaturesAndMask(signers, threshold, messageDigestBytes);

      const ok = await verifier.verify(messageDigestBytes, mask, vs, rs, ss);

      expect(ok).to.be.true;
    });

    it(`Should not admit signers fewer than quorum (${threshold - 1} < ${threshold} of ${total})`, async function() {
      const signers = randomSigners(total);
      const addresses = signers.map(signer => signer.address);

      const ECDSAVerifier = await hre.ethers.getContractFactory("ECDSAVerifier");
      const verifier = await ECDSAVerifier.deploy(addresses, threshold);
      await verifier.deployed();

      const messageDigestBytes = getMessageDigestBytes();

      const [vs, rs, ss, mask] = await getSignaturesAndMask(signers, threshold - 1, messageDigestBytes);
      await expect(verifier.verify(
        messageDigestBytes, mask, vs, rs, ss)).to.be.revertedWith("too few signers");
    });

    it(`Should not admit even one invalid signature (${threshold} of ${total})`, async function() {
      const signers = randomSigners(total);
      const addresses = signers.map(signer => signer.address);

      const ECDSAVerifier = await hre.ethers.getContractFactory("ECDSAVerifier");
      const verifier = await ECDSAVerifier.deploy(addresses, threshold);
      await verifier.deployed();

      const messageDigestBytes = getMessageDigestBytes();

      let signatures = await Promise.all(
        signers.slice(0, threshold).map(async signer => {
          let signature = await signer.signMessage(messageDigestBytes);
          return hre.ethers.utils.splitSignature(signature);
        }));

      let vs = signatures.map(s => s.v);
      let rs = signatures.map(s => s.r);
      let ss = signatures.map(s => s.s);

      // Replace a signature with an invalid one.
      rs[0] = hre.ethers.utils.hexlify(hre.ethers.utils.randomBytes(32));

      let mask = signers.map((_, index) => index < threshold);

      await expect(verifier.verify(
        messageDigestBytes, mask, vs, rs, ss)).to.be.revertedWith("invalid signature");
    });
  }
});

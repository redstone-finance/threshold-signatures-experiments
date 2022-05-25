const { expect } = require("chai");
const { ethers } = require("hardhat");
const { getBlsInputs } = require("../utils/utils.js");

describe("BLS crypto", function () {
  const groupSizes = [
    // M out of N.
    [ 5, 8 ],
    [ 9, 16 ],
    [ 17, 32 ],
  ];

  for ([threshold, total] of groupSizes) {
    it(`Should admit minimal quorum (${threshold} of ${total})`, async function () {
      const BlsSignatureTest = await hre.ethers.getContractFactory("BlsSignatureTest");
      const verifier = await BlsSignatureTest.deploy();
      await verifier.deployed();

      const {
        aggregatedPublicKey,
        partPublicKey,
        message,
        partSignature,
        signersBitmask } = await getBlsInputs(32, threshold, total);

      const tx = await verifier.verifyMultisignature(
        `0x${aggregatedPublicKey}`,
        `0x${partPublicKey}`,
        `0x${message}`,
        `0x${partSignature}`,
        `0x${signersBitmask}`);

      const receipt = await tx.wait();
    });
  }
});

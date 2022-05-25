const { ethers } = require("hardhat");

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

module.exports = {
  randomSigners,
  getMessageDigestBytes,
  getSignaturesAndMask,
}

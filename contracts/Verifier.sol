//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract Verifier {
  address private oracle;

  constructor(address _oracle) {
    oracle = _oracle;
  }

  function verifyHash(bytes32 hash, uint8 v, bytes32 r, bytes32 s)
  public returns (bool) {
    bytes32 messageDigest = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    address signer = ecrecover(messageDigest, v, r, s);
    return signer == oracle;
  }
}

//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract ECDSAVerifier {
  address[] private oracles;
  uint threshold;

  // We include some mutable state to measure gas usage of verify more
  // easily.
  uint successfulVerifications;

  constructor(address[] memory _oracles, uint _threshold) {
    oracles = _oracles;
    threshold = _threshold;
    successfulVerifications = 0;
  }

  function verify(bytes32 hash,
                  bool[] memory signers,
                  uint8[] memory v,
                  bytes32[] memory r,
                  bytes32[] memory s)
  public view returns (bool) {
    require(oracles.length == signers.length, "signers must have length equal to oracles");

    bytes32 messageDigest = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));

    uint nextSignatureIndex = 0;
    for (uint oracleIndex = 0; oracleIndex < signers.length; oracleIndex++) {
      if (signers[oracleIndex]) {
        uint i = nextSignatureIndex;
        address signer = ecrecover(messageDigest, v[i], r[i], s[i]);
        require(signer == oracles[oracleIndex], "invalid signature");
        nextSignatureIndex++;
      }
    }

    uint numberOfSignatures = nextSignatureIndex;
    require(numberOfSignatures >= threshold, "too few signers");
    
    return true;
  }

  function verifyAndMutate(bytes32 hash,
                           bool[] calldata signers,
                           uint8[] calldata v,
                           bytes32[] calldata r,
                           bytes32[] calldata s)
  external {
    if (verify(hash, signers, v, r, s)) {
      successfulVerifications += 1;
    }
  }
}

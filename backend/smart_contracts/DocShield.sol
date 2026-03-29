pragma solidity ^0.8.0;

contract DocShield {
    event DocumentUploaded(address indexed user, bytes32 fileHash, uint256 timestamp);
    event DocumentShared(bytes32 linkToken, bytes32 fileHash, uint256 expiry);
    event DocumentAccessed(address indexed accessor, bytes32 linkToken, uint256 timestamp);

    function logUpload(bytes32 fileHash) external {
    emit DocumentUploaded(msg.sender, fileHash, block.timestamp);
}
function logShare(bytes32 linkToken, bytes32 fileHash, uint256 expiry) external {
    emit DocumentShared(linkToken, fileHash, expiry);
}
function logAccess(bytes32 linkToken) external {
    emit DocumentAccessed(msg.sender, linkToken, block.timestamp);
}

}

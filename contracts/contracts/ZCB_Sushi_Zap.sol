// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ZCB_Sushi_Zap {
    string public hello;

    event test(uint256 timestamp);

    constructor(string memory _hello) {
        hello = _hello;

        emit test(block.timestamp);
    }
}

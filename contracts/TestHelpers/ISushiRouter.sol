// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ISushiRouter {
    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts);
}

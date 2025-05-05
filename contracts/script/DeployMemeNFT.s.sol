// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MemeNFT.sol";

contract DeployMemeNFT is Script {
    function run() external {
        vm.startBroadcast();
        
        MemeNFT memeNFT = new MemeNFT();
        
        vm.stopBroadcast();
        
        console.log("MemeNFT deployed to:", address(memeNFT));
    }
} 
// SPDX-License-Identifier: MIT

pragma solidity ^0.4.18;

contract WETH9 {
    string public name = "Wrapped Ether";
    string public symbol = "WETH";
    uint8 public decimals = 18;

    event Approval(address indexed src, address indexed guy, uint256 wad_one);
    event Transfer(address indexed src, address indexed dst, uint256 wad_one);
    event Deposit(address indexed dst, uint256 wad_one);
    event Withdrawal(address indexed src, uint256 wad_one);

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function() public payable {
        deposit();
    }

    function deposit() public payable {
        balanceOf[msg.sender] += msg.value;
        Deposit(msg.sender, msg.value);
    }

    function withdraw(uint256 wad_one) public {
        require(balanceOf[msg.sender] >= wad_one);
        balanceOf[msg.sender] -= wad_one;
        msg.sender.transfer(wad_one);
        Withdrawal(msg.sender, wad_one);
    }

    function totalSupply() public view returns (uint256) {
        return this.balance;
    }

    function approve(address guy, uint256 wad_one) public returns (bool) {
        allowance[msg.sender][guy] = wad_one;
        Approval(msg.sender, guy, wad_one);
        return true;
    }

    function transfer(address dst, uint256 wad_one) public returns (bool) {
        return transferFrom(msg.sender, dst, wad_one);
    }

    function transferFrom(
        address src,
        address dst,
        uint256 wad_one
    ) public returns (bool) {
        require(balanceOf[src] >= wad_one);

        if (src != msg.sender && allowance[src][msg.sender] != uint256(-1)) {
            require(allowance[src][msg.sender] >= wad_one);
            allowance[src][msg.sender] -= wad_one;
        }

        balanceOf[src] -= wad_one;
        balanceOf[dst] += wad_one;

        Transfer(src, dst, wad_one);

        return true;
    }
}

// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import "../features/MaxBalance.sol";

contract MaxBalanceTest is MaxBalance {
    /**
    *  @dev See {ICompliance-transferred}.
    */
    function transferred(address _from, address _to, uint256 _value) external onlyToken override {
        _transferActionOnMaxBalance(_from, _to, _value);
    }

    /**
     *  @dev See {ICompliance-created}.
     */
    function created(address _to, uint256 _value) external onlyToken override {
        _creationActionOnMaxBalance(_to, _value);
    }

    /**
     *  @dev See {ICompliance-destroyed}.
     */
    function destroyed(address _from, uint256 _value) external onlyToken override {
        _destructionActionOnMaxBalance(_from, _value);
    }

    /**
     *  @dev See {ICompliance-canTransfer}.
     */
    function canTransfer(address _from, address _to, uint256 _value) external view override returns (bool) {
        if (!complianceCheckOnMaxBalance(_from, _to, _value))
        {
            return false;
        }
        return true;
    }
}

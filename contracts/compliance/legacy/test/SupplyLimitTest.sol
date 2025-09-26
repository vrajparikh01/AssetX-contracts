// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import "../features/SupplyLimit.sol";

contract SupplyLimitTest is SupplyLimit {
    /**
    *  @dev See {ICompliance-transferred}.
    */
    function transferred(address _from, address _to, uint256 _value) external onlyToken override {
        _transferActionOnSupplyLimit(_from, _to, _value);
    }

    /**
     *  @dev See {ICompliance-created}.
     */
    function created(address _to, uint256 _value) external onlyToken override {
        _creationActionOnSupplyLimit(_to, _value);
    }

    /**
     *  @dev See {ICompliance-destroyed}.
     */
    function destroyed(address _from, uint256 _value) external onlyToken override {
        _destructionActionOnSupplyLimit(_from, _value);
    }

    /**
     *  @dev See {ICompliance-canTransfer}.
     */
    function canTransfer(address _from, address _to, uint256 _value) external view override returns (bool) {
        if (!complianceCheckOnSupplyLimit(_from, _to, _value))
        {
            return false;
        }
        return true;
    }
}

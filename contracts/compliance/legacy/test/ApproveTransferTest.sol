// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import "../features/ApproveTransfer.sol";

contract ApproveTransferTest is ApproveTransfer {
    /**
    *  @dev See {ICompliance-transferred}.
    */
    function transferred(address _from, address _to, uint256 _value) external onlyToken override {
        _transferActionOnApproveTransfer(_from, _to, _value);
    }

    /**
     *  @dev See {ICompliance-created}.
     */
    function created(address _to, uint256 _value) external onlyToken override {
        _creationActionOnApproveTransfer(_to, _value);
    }

    /**
     *  @dev See {ICompliance-destroyed}.
     */
    function destroyed(address _from, uint256 _value) external onlyToken override {
        _destructionActionOnApproveTransfer(_from, _value);
    }

    /**
     *  @dev See {ICompliance-canTransfer}.
     */
    function canTransfer(address _from, address _to, uint256 _value) external view override returns (bool) {
        if (!complianceCheckOnApproveTransfer(_from, _to, _value))
        {
            return false;
        }
        return true;
    }
}


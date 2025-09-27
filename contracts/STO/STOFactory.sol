// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "../RWA/IToken.sol";
import "./WETH.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract STOFactory is Ownable {
    address public custodyAddress;

    struct STOInfo {
        address rwaToken;
        address wrappedAddress; // Add wrapped token address
        string stoTokenName;
        string stoTokenSymbol;
        uint256 initialSupply;
        string stoImage;
        string country;
        string issuer;
        uint256 issuanceDate;
        string industry;
        string companyWebsite;
        string description;
        bool featured;
    }

    mapping(address => address) public STOs; // Map RWA token to wrapped token
    mapping(address => address) public STOOwners; // Map wrapped token to owner
    STOInfo[] public allSTOs; // Store all STO info

    string[] public validCountries; 
    string[] public validIndustries;

    constructor(address _custodyAddress) {
        custodyAddress = _custodyAddress;
    }

    function addCountry(string memory country) external onlyOwner {
        validCountries.push(country);
    }

    function addIndustry(string memory industry) external onlyOwner {
        validIndustries.push(industry);
    }

    function isValidCountry(string memory country) public view returns (bool) {
        for (uint256 i = 0; i < validCountries.length; i++) {
            if (keccak256(abi.encodePacked(validCountries[i])) == keccak256(abi.encodePacked(country))) {
                return true;
            }
        }
        return false;
    }

    function isValidIndustry(string memory industry) public view returns (bool) {
        for (uint256 i = 0; i < validIndustries.length; i++) {
            if (keccak256(abi.encodePacked(validIndustries[i])) == keccak256(abi.encodePacked(industry))) {
                return true;
            }
        }
        return false;
    }

    function createSTO(
        address rwaToken, 
        string memory stoTokenName,
        string memory stoTokenSymbol,
        uint256 initialSupply,
        string memory stoImage,
        string memory country,
        string memory issuer,
        uint256 issuanceDate,
        string memory industry,
        string memory companyWebsite,
        string memory description
    ) external returns (WETH) {
        require(STOs[rwaToken] == address(0), "STO already exists");

        // Validate that the provided country and industry exist in the owner-set lists
        require(isValidCountry(country), "Invalid country");
        require(isValidIndustry(industry), "Invalid industry");

        // Transfer RWA token to 3rd party Custody
        IToken(rwaToken).transferFrom(msg.sender, custodyAddress, initialSupply);

        // Create wrapped RWA token
        WETH wrappedToken = new WETH(stoTokenName, stoTokenSymbol, address(this), initialSupply);

        // Store STO info
        STOs[rwaToken] = address(wrappedToken);
        STOOwners[address(wrappedToken)] = msg.sender;

        allSTOs.push(STOInfo({
            rwaToken: rwaToken,
            wrappedAddress: address(wrappedToken), // Automatically set wrapped token address
            stoTokenName: stoTokenName,
            stoTokenSymbol: stoTokenSymbol,
            initialSupply: initialSupply,
            companyWebsite: companyWebsite,
            stoImage: stoImage,
            country: country,
            issuer: issuer,
            issuanceDate: issuanceDate,
            industry: industry,
            description: description,
            featured: false
        }));

        // Transfer ownership and supply of wrapped token to the STO creator (msg.sender)
        wrappedToken.transfer(msg.sender, initialSupply);
        wrappedToken.transferOwnership(msg.sender);

        return wrappedToken;
    }

    function getSTOInfo(address rwaToken) external view returns (STOInfo memory) {
        require(STOs[rwaToken] != address(0), "STO does not exist");
        
        for (uint256 i = 0; i < allSTOs.length; i++) {
            if (allSTOs[i].rwaToken == rwaToken) {
                return allSTOs[i];
            }
        }

        revert("STO info not found");
    }

    function getAllSTOs() external view returns (STOInfo[] memory) {
        return allSTOs;
    }

    function getSTOCount() external view returns (uint256) {
        return allSTOs.length;
    }

    function getValidCountries() external view returns (string[] memory) {
        return validCountries;
    }

    function getValidIndustries() external view returns (string[] memory) {
        return validIndustries;
    }

    function changeSTOFeatureStatus(address rwaToken, bool featured) external onlyOwner {
        require(STOs[rwaToken] != address(0), "STO does not exist");

        for (uint256 i = 0; i < allSTOs.length; i++) {
            if (allSTOs[i].rwaToken == rwaToken) {
                allSTOs[i].featured = featured;
                return;
            }
        }
    }

    function getSTOsByOwner(address owner) external view returns (STOInfo[] memory) {
        uint256 resultCount;
        
        // First, count how many STOs the owner has
        for (uint256 i = 0; i < allSTOs.length; i++) {
            if (STOOwners[allSTOs[i].wrappedAddress] == owner) {
                resultCount++;
            }
        }

        STOInfo[] memory result = new STOInfo[](resultCount);
        uint256 resultIndex;

        // Populate the array with the owner's STOs
        for (uint256 i = 0; i < allSTOs.length; i++) {
            if (STOOwners[allSTOs[i].wrappedAddress] == owner) {
                result[resultIndex] = allSTOs[i];
                resultIndex++;
            }
        }

        return result;
    }

    function getFeaturedSTOs() external view returns (STOInfo[] memory) {
        uint256 resultCount;

        for (uint256 i = 0; i < allSTOs.length; i++) {
            if (allSTOs[i].featured) {
                resultCount++;
            }
        }

        STOInfo[] memory result = new STOInfo[](resultCount);
        uint256 resultIndex;

        // Populate the array with the featured STOs
        for (uint256 i = 0; i < allSTOs.length; i++) {
            if (allSTOs[i].featured) {
                result[resultIndex] = allSTOs[i];
                resultIndex++;
            }
        }

        return result;
    }
}

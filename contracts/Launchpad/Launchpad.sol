// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../mocks/IERC20.sol";

contract Launchpad is Ownable {
    mapping(address => stoListing) public listings;
    mapping(address => bool) public isClaimedRaisedFund;
    mapping(address => mapping(address => uint256)) public investments;
    mapping(address => mapping(address => bool)) public claimedStoToken;
    mapping(address => uint256) public investorCount;
    mapping(address => stoDetails) public details;
    address[] public stoTokens;
    string[] public validCountries;
    string[] public validInvestmentType;
    string[] public validIndustries;

    struct investment {
        address stoToken;
        uint256 amount;
    }

    struct stoDetails {
        string overview;
        string companyWebsite;
        string issuer;
        string country;
        string industry;
        string investmentType;
        string image;
    }

    struct stoListing {
        address stoToken;
        address baseToken;
        uint256 softCap;
        uint256 hardCap;
        uint256 minInvestment;
        uint256 maxInvestment;
        uint256 startTime;
        uint256 endTime;
        uint256 tokenClaimTime;
        uint256 tokenPriceStoToken;
        uint256 tokenPriceBaseToken;
        address owner;
        uint256 raisedAmount;
    }

    // constructor() Ownable(msg.sender) {}

    function addCountry(string memory country) public onlyOwner {
        validCountries.push(country);
    }

    function addInvestmentType(string memory investmentType) public onlyOwner {
        validInvestmentType.push(investmentType);
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

    function isValidInvestmentType(string memory investmentType) public view returns (bool) {
        for (uint256 i = 0; i < validInvestmentType.length; i++) {
            if (keccak256(abi.encodePacked(validInvestmentType[i])) == keccak256(abi.encodePacked(investmentType))) {
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

    function getValidCountries() external view returns (string[] memory) {
        return validCountries;
    }

    function getValidIndustries() external view returns (string[] memory) {
        return validIndustries;
    }

    function getValidInvestmentType() external view returns (string[] memory) {
        return validInvestmentType;
    }

    function listSTO(stoListing memory stoDetail, stoDetails memory stoInfo) public {
        require(stoDetail.stoToken != address(0), "STO Token address cannot be 0");
        require(stoDetail.baseToken != address(0), "Base Token address cannot be 0");
        require(stoDetail.softCap > 0, "Soft cap must be greater than 0");
        require(stoDetail.hardCap > 0, "Hard cap must be greater than 0");
        require(stoDetail.softCap <= stoDetail.hardCap, "Soft cap must be less than or equal to hard cap");
        require(stoDetail.minInvestment > 0, "Minimum investment must be greater than 0");
        require(stoDetail.maxInvestment > 0, "Maximum investment must be greater than 0");
        require(stoDetail.minInvestment <= stoDetail.maxInvestment, "Minimum investment must be less than or equal to maximum investment");
        require(stoDetail.startTime > block.timestamp, "Start time must be greater than current time");
        require(stoDetail.endTime > block.timestamp, "End time must be greater than current time");
        require(stoDetail.startTime < stoDetail.endTime, "Start time must be less than end time");
        require(stoDetail.tokenClaimTime > stoDetail.endTime, "Token claim time must be greater than end time");
        require(stoDetail.tokenPriceStoToken > 0, "Token price in STO token must be greater than 0");
        require(stoDetail.tokenPriceBaseToken > 0, "Token price in base token must be greater than 0");

        listings[stoDetail.stoToken] = stoDetail;

        details[stoDetail.stoToken] = stoInfo;

        // Add new STO token to array
        stoTokens.push(stoDetail.stoToken);

        uint256 stoAmount = (stoDetail.hardCap * (10**IERC20(stoDetail.stoToken).decimals())) / (10**IERC20(stoDetail.baseToken).decimals());
        stoAmount = stoAmount * stoDetail.tokenPriceStoToken / stoDetail.tokenPriceBaseToken;

        // Transfer ownership of STO token to this contract
        IERC20(stoDetail.stoToken).transferFrom(msg.sender, address(this), stoAmount);
    }

    function invest(address stoToken, uint256 amount) public {
        stoListing storage listing = listings[stoToken];
        require(listing.stoToken != address(0), "STO token not found");
        require(block.timestamp >= listing.startTime, "STO has not started yet");
        require(block.timestamp <= listing.endTime, "STO has ended");
        require(amount >= listing.minInvestment, "Amount is less than minimum investment");
        require(amount <= listing.maxInvestment, "Amount is greater than maximum investment");
        require(listing.raisedAmount + amount <= listing.hardCap, "Amount exceeds hard cap");

        // Transfer base token to this contract
        IERC20(listing.baseToken).transferFrom(msg.sender, address(this), amount);

        // Calculate number of tokens to mint
        investments[msg.sender][stoToken] += amount;
        listing.raisedAmount += amount;
        investorCount[stoToken] += investments[msg.sender][stoToken] == amount ? 1 : 0;
    }

    function claimTokens(address stoToken) public {
        stoListing storage listing = listings[stoToken];
        require(listing.stoToken != address(0), "STO token not found");
        require(block.timestamp >= listing.tokenClaimTime, "Token claim time has not arrived");
        require(listing.raisedAmount >= listing.softCap, "STO has not reached softcap");
        require(claimedStoToken[msg.sender][stoToken] == false, "Tokens already claimed");

        uint256 amount = investments[msg.sender][stoToken] * listing.tokenPriceStoToken / listing.tokenPriceBaseToken;
        amount = (amount * (10**IERC20(stoToken).decimals()))/ (10**IERC20(listing.baseToken).decimals());
        require(amount > 0, "No tokens to claim");

        claimedStoToken[msg.sender][stoToken] = true;

        // Transfer STO tokens to investor
        IERC20(stoToken).transfer(msg.sender, amount);
    }

    function claimBaseToken(address stoToken) public onlyOwner {
        stoListing storage listing = listings[stoToken];
        require(listing.stoToken != address(0), "STO token not found");
        require(block.timestamp >= listing.tokenClaimTime, "Token claim time has not arrived");
        require(listing.raisedAmount >= listing.softCap, "STO has not reached soft cap");
        require(isClaimedRaisedFund[stoToken] == false, "Base tokens already claimed");

        uint256 amount = listing.raisedAmount;
        require(amount > 0, "No base tokens to claim");
        isClaimedRaisedFund[stoToken] = true;

        // Transfer base tokens to investor
        IERC20(listing.baseToken).transfer(msg.sender, amount);
    }

    function withdrawBaseToken(address stoToken) public {
        uint256 amount = investments[msg.sender][stoToken];
        stoListing storage listing = listings[stoToken];
        require(listing.endTime < block.timestamp, "STO has not ended yet");
        require(listing.softCap > listing.raisedAmount, "STO has reached soft cap");
        require(amount > 0, "No base tokens to withdraw");

        investments[msg.sender][stoToken] = 0;

        // Transfer base tokens to investor
        IERC20(listing.baseToken).transfer(msg.sender, amount);
    }

    function withdrawSTOToken(address stoToken) public {
        stoListing storage listing = listings[stoToken];
        uint256 amount = (listing.hardCap * (10**IERC20(listing.stoToken).decimals())) / (10**IERC20(listing.baseToken).decimals());
        amount = amount * listing.tokenPriceStoToken / listing.tokenPriceBaseToken;
        require(listing.endTime < block.timestamp, "STO has not ended yet");
        require(listing.softCap > listing.raisedAmount, "STO has reached soft cap");
        require(msg.sender == listing.owner, "Only owner can withdraw STO tokens");
        require(amount > 0, "No STO tokens to withdraw");

        listing.hardCap = 0;
        listing.softCap = 0;

        // Transfer STO tokens to investor
        IERC20(stoToken).transfer(listing.owner, amount);
    }

    // Function to get all investments of an investor for each STO token
    function getInvestment(address investor) public view returns (investment[] memory) {
        uint256 investmentCount = 0;
        for(uint256 i = 0; i < stoTokens.length; i++) {
            if(investments[investor][stoTokens[i]] > 0) {
                investmentCount++;
            }
        }

        investment[] memory investorInvestment = new investment[](investmentCount);

        for(uint256 i = 0; i < stoTokens.length; i++) {
            if(investments[investor][stoTokens[i]] > 0) {
                investorInvestment[i] = investment(stoTokens[i], investments[investor][stoTokens[i]]);
            }
        }

        return investorInvestment;
    }

    // Function to get all listed sto tokens for a particular owner
    function getSTOTokens(address owner) public view returns (stoListing[] memory) {
        uint256 tokenCount = 0;
        for(uint256 i = 0; i < stoTokens.length; i++) {
            if(listings[stoTokens[i]].owner == owner) {
                tokenCount++;
            }
        }

        stoListing[] memory ownerSTOTokens = new stoListing[](tokenCount);

        for(uint256 i = 0; i < stoTokens.length; i++) {
            if(listings[stoTokens[i]].owner == owner) {
                ownerSTOTokens[i] = listings[stoTokens[i]];
            }
        }

        return ownerSTOTokens;
    }

    function getAllSTO() public view returns (stoListing[] memory) {
        stoListing[] memory allSTOTokens = new stoListing[](stoTokens.length);

        for(uint256 i = 0; i < stoTokens.length; i++) {
            allSTOTokens[i] = listings[stoTokens[i]];
        }

        return allSTOTokens;
    }
}

// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;

import "../node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";

contract StarNotary is ERC721 {
    // Implemending a name and a symbol through constructor
    // the name and symbol is inserted in ../migrations/2_deploy_contracts.js
    // If there is another easier solution I will be very happy to know it :)
    string public name;
    string public symbol;

    constructor(string memory _name, string memory _symbol) ERC721() public {
        name = _name;
        symbol = _symbol;
    }

    // Star data
    struct Star {
        string name;
    }

    // mapping the Star with the star's id
    mapping(uint256 => Star) public tokenIdToStarInfo;
    // mapping the TokenId and price
    mapping(uint256 => uint256) public starsForSale;
    // mapping to send another user proposal for exchanging a star
    // address saves the second owner of his star, address we are sending proposal to
    mapping(address => mapping(uint256 => uint256)) public starsForExchange;

    // Create Star using the Struct
    function createStar(string memory _name, uint256 _tokenId) public {
        Star memory newStar = Star(_name);
        tokenIdToStarInfo[_tokenId] = newStar;
        _mint(msg.sender, _tokenId);
    }
    // Putting an Star for sale (Adding the star tokenid into the mapping 
    // starsForSale, first verify that the sender is the owner)
    function putStarUpForSale(uint256 _tokenId, uint256 _price) public {
        require(ownerOf(_tokenId) == msg.sender);
        starsForSale[_tokenId] = _price;
    }
    // Function that allows you to convert an address into a payable address
    function _make_payable(address x) internal pure returns (address payable) {
        return address(uint160(x));
    }
    // buying the stars that are for sale (first is testing if it is for sale, 
    // another test if the buyer is sending enough ether)
    function buyStar(uint256 _tokenId) public payable {
        require(starsForSale[_tokenId] > 0, "The star should be up for sale");

        uint256 starCost = starsForSale[_tokenId];
        address starOwner = ownerOf(_tokenId);
        require(msg.value >= starCost, "You need to have enough Ether");
        //'_transferFrom' used here instead of 'transferFrom' to avoid approval error
        _transferFrom(starOwner, msg.sender, _tokenId);
        address payable ownerAddressPayable = _make_payable(starOwner);
        ownerAddressPayable.transfer(starCost);
        // added a deletion from starsForSale mapping,i noticed 
        // on my front-end that the star was still up for sale after being sold
        // it only had a different user selling it
        delete starsForSale[_tokenId];

        if(msg.value > starCost) {
            msg.sender.transfer(msg.value - starCost);
        }
    }
    // function used to check the name of the star by entering the stars ID.
    function lookUptokenIdToStarInfo (uint _tokenId) public view returns (string memory) {
        Star memory starData = tokenIdToStarInfo[_tokenId];
        return starData.name;
    }

    // function for sending a proposal to exchange stars
    // it saves a mapping (look up for starsForExchange)
    function proposeExchangeStars (uint256 _tokenId1, uint256 _tokenId2) public {
        require(msg.sender == ownerOf(_tokenId1), "You are not the owner of the star you are trying to exchange");
        address ownerTo = ownerOf(_tokenId2);
        starsForExchange[ownerTo][_tokenId2] = _tokenId1;
    }
    // helper function that i used in testing to see if it is added to starsForExchange
    function getStarsForExchange(address _proposedTo, uint256 _proposedToStar) public view returns(uint256) {
        return starsForExchange[_proposedTo][_proposedToStar];
    }
    // function allowing the user to exchange star,
    // allows the sender to accept proposal, if it is in the starsForExchange array 
    // and change the owners of both stars
    function exchangeStars(uint256 _tokenId1, uint256 _tokenId2) public {
        require(starsForExchange[msg.sender][_tokenId1] == _tokenId2, "The star is not proposed to be exchanged");

        address starOwner = ownerOf(_tokenId2);
        
        _transferFrom(starOwner, msg.sender, _tokenId2);
        _transferFrom(msg.sender, starOwner, _tokenId1);
    }

    // function that allows user to send his star to another user
    function transferStar(address _to1, uint256 _tokenId) public {
        require(msg.sender == ownerOf(_tokenId), "You are not the owner of the star.");
        _transferFrom(msg.sender, _to1, _tokenId);
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "fhevm/lib/TFHE.sol";
import "hardhat/console.sol";
import "./Set.sol";

import "@openzeppelin/contracts@4.7.0/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts@4.7.0/token/ERC721/extensions/ERC721URIStorage.sol";

contract ChainCo is ERC721, ERC721URIStorage {
    euint32 public storeEncrypt;
    uint32 public actualVal;

    function storeAndEncrypt(bytes calldata ciphertext) internal {
        euint32 hiddenvalue = TFHE.asEuint32(ciphertext);
        storeEncrypt = hiddenvalue;
    }

    function storeAndEncryptNum(uint32 val) internal {
        euint32 hiddenvalue = TFHE.asEuint32(val);
        storeEncrypt = hiddenvalue;
    }

    function DecryptToVal(euint32 ciphertext) public {
        uint32 valuedecrypted = TFHE.decrypt(ciphertext);
        actualVal = valuedecrypted;
    }

    function convertString(uint32 val) public pure returns(string memory){
        string memory res = new string(val);
        return res;
    }

    mapping(address => string) public creds; // whitelisting 
    uint256 public total_mints; // total mints from this smart contract
    mapping(address => uint256) public total_sbt_received_from_org; // total SBT's recieved in the user account from authorized user
    uint256 public total_endorsements; // total endorsed SBT's recieved in the user account from a user who holds the actual SBT 
    mapping(address => uint256) public total_endorsement_given; // total endorsements given by a user who has SBT from org
    mapping(address => uint256) private endorsements_allowed; // total endorsements the current user can perform
    mapping(address => uint256) private endorsement_received; // endorsements recieved
    mapping(address => uint256[]) private tokenIds_in_account_from_org; // Total tokenIds in mapped account
    mapping(address => uint256[]) private tokenIds_from_endorsing; // Total tokenIds from endorsing
    uint256 private tokenId; // tokenId increment for all NFT 
    address public owner; // Owner of the smart contract 
    address private burning_address = 0x000000000000000000000000000000000000dEaD; // Burning address
    Set private accounts = new Set(); // Data structure

    event Minted(address _to, uint256 _tokenId, string _uri); // Event after SBT has been minted from organization
    event MultipleMinted(address[] _to, string[] _uri); // Bulk transaction using multibatch transaction
    event EndorsedMint(address _from, address _to, string _uri); // Event after SBT has been endorsed

    constructor() ERC721("ChainCo", "CCO") {
        creds[0xdC737Bc0B2174a5d4A8CA7b588905c7770C671ee] = "123";
        creds[0x5B38Da6a701c568545dCfcB03FcB875f56beddC4] = "456";
        creds[0x6A475ED41c9A172332DBa2308e5D6D059F650E12] = "son";
        owner = msg.sender;
    }

    /*
    * @notice Only owner who deployed this contract
    */ 
    modifier onlyOwner() {
        require(bytes(creds[msg.sender]).length > 0, "Not Authorized Organization");
        _;
    }

    /*
    * @notice Mint soul bound token
    * @param:
        @to: address who will recieve the soul bound token
        @uri: cid hash received from the lighthouse.storage
    */
    function safeMint(address to, string memory uri) public onlyOwner {
        tokenId += 1;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        accounts.add(to);
        total_mints += 1;
        total_sbt_received_from_org[to] += 1;
        endorsements_allowed[to] += 1;
        tokenIds_in_account_from_org[to].push(tokenId);
        emit Minted(to, tokenId, uri);
    }

    /*
    * @notice Check before Endorsing
    */

    modifier checkEndorsement() {
        require((endorsements_allowed[msg.sender] > 0 && total_sbt_received_from_org[msg.sender]>0), "Endorsement not allowed");
        _;
    }

    /*
    * @notice Minting an Endorsed Soul Bound Token
    * @param:
        @to: address who will recieve the soul bound token
        @uri: cid hash received from the lighthouse.storage
    */
    function endorseMint(address to, string memory uri) public checkEndorsement() {
        tokenId += 1;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        accounts.add(to);
        total_mints += 1;
        endorsements_allowed[msg.sender] -= 1;
        total_endorsement_given[msg.sender] += 1; 
        endorsement_received[to] += 1;
        tokenIds_from_endorsing[to].push(tokenId);
        total_endorsements += 1;
        emit EndorsedMint(msg.sender, to, uri);
    }

    /*
    * @notice Mint multiple soul bound Token 
    * @param:
        @_to[]: addresses who will recieve the soul bound token
        @_uri[]: cid's hash received from the lighthouse.storage
    */
    function mintBatch(address[] memory _to, string[] memory _uri) external onlyOwner {
        for (uint256 i = 0; i < _to.length; i++) {
            tokenId += 1;
            _safeMint(_to[i], tokenId);
            _setTokenURI(tokenId, _uri[i]);
            accounts.add(_to[i]);
            total_mints += 1;
            total_sbt_received_from_org[_to[i]] += 1;
            endorsements_allowed[_to[i]] += 1;
            tokenIds_in_account_from_org[_to[i]].push(tokenId);
        }
        emit MultipleMinted(_to, _uri);
    }

    // The following functions are overrides required by Solidity.

    function _burn(uint256 _tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(_tokenId);
    }

    /*
    * @notice Get token CID from lighthouse.storage
    * @param:
        @_tokenId
    */
    function tokenURI(uint256 _tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(_tokenId);
    }

    /*
    * @notice get values of whitelisted org
    * @param:
        @_new: address of the org if present
    */
    function getVal(address _new) public view returns(string memory) {
        return creds[_new];
    }

    // Soul Bound property 
    /*
    * @notice Soul Bound property of burning
    * @param:
        @from: address who will recieve the soul bound token
        @to: transferring address
    */
    function _beforeTokenTransfer(address from, address to, uint256 _tokenId) internal override virtual { 
        require(from == address(0) || to == burning_address, "Err: token transfer is BLOCKED"); 
        super._beforeTokenTransfer(from, to, _tokenId);
        if(to == burning_address){
            total_sbt_received_from_org[from] -= 1;
            uint256 j;
            bool flag = false;
            for(uint256 i = 0; i<tokenIds_in_account_from_org[from].length; i++){
                if(tokenIds_in_account_from_org[from][i] == _tokenId){
                    j = i;
                    flag = true;
                    break;
                }
            }
            tokenIds_in_account_from_org[from][j] = tokenIds_in_account_from_org[from][tokenIds_in_account_from_org[from].length-1];
            tokenIds_in_account_from_org[from].pop();
            if(!flag){
                for(uint256 i = 0; i<tokenIds_from_endorsing[from].length; i++){
                    if(tokenIds_from_endorsing[from][i] == _tokenId){
                        j = i;
                        break;
                    }
            }
            tokenIds_from_endorsing[from][j] = tokenIds_from_endorsing[from][tokenIds_from_endorsing[from].length-1];
            tokenIds_from_endorsing[from].pop();
            }
        }
    }

    /*
    * @notice get total overall mints
    */
    function getTotalMints() public view returns (uint256) {
        return total_mints;
    }

    /*
    * @notice get Token id of the current state
    */
    function getTokenId() public view returns(uint256) {
        return tokenId;
    }

    /*
    * @notice Get the total endorsements received to the given _address
    * @param:
        @_address: address of the contract
    */
    function getEndorsementsReceived(address _address) public view returns(uint256){
        return endorsement_received[_address];
    }

    /*
    * @notice Get the total endorsements allowed for the given _address
    * @param:
        @_address: address of the contract
    */
    function GetEndorsementsAllowed(address _address) public view returns(uint256) {
        return endorsements_allowed[_address];
    }

    /*
    * @notice Get token id's of the given _address
    * @param:
        @_address: address of the given input
    */
    function getTokenIdAccount(address _address) public view returns(uint256[] memory) {
        return tokenIds_in_account_from_org[_address];
    }

    /*
    * @notice Get token id's of the account that has all endorsings
    * @param:
        @_address: address of the given input
    */
    function getTokenIdAccountEndorsing(address _address) public view returns(uint256[] memory){
        return tokenIds_from_endorsing[_address];
    }

    /*
    * @notice Get token id's of the given _address
    * @param:
        @_address: address of the given input
    */
    function getAccounts() public view returns(address[] memory) {
        return accounts.getItems();
    }


}
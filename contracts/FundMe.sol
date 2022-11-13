/*
sending eth to the function and reverts
Get funds from user 
Withdarw funds
Set a minimum funding 
Replacing require with the revert help with the gas because we are not storig the string
*/

//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//imports
import 'hardhat/console.sol';
import './PriceConverter.sol'; //importing the library made in different file
// Gas Cost = 822980 while doing it through VM
// Transaction Cost = 803654 after using constant keyword for the variable

//
error FundMe__NotOwner(); //Declared outside of contract and are custom errors and end up saving a lot of gas as we are not calling full string

/**
 * @title A contract for crowd funding
 * @author Ankush
 * @notice This contract is a demo for funding contracts
 * @dev All function calls are currently implemented without side effects
 */

//interfaces, contracts
contract FundMe {
    // type declaration
    using PriceConverter for uint256; //using library as a template for program

    // state variables - storing these global variables cost us gas and hence we should try to minimize them
    uint256 public constant MINIMUM_USD = 50 * 10**18;
    /*
    21393 while using constant = 21393*9000000000 = $0.02 
    Here 9000000000 is the gas price of etherium in wei which gives answer in wei later converted to eth and USD
    23493 while it isn't used = 23493*9000000000 = $0.03
    */
    address[] private s_funders; //array of addresses
    uint256 public totalEth; //total amount of eth in the contract
    mapping(address => uint256) private s_addressToAmountFunded; //just like the dictionary in python
    //s_ tells that it is storage class variable
    address private immutable i_owner;

    /*
    Keyword immutable also have similar gas savings as constant 
    A good practice is using i_ so that we know this variable is immutable
    Transaction Cost before immutable = 803654
    Transaction Cost after immutable = 780159
    */
    AggregatorV3Interface private s_priceFeed;

    constructor(address priceFeedAddress) {
        //called right away when the contract is deployed
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
        console.log('So the owner of the contract is %s ', msg.sender); //using above hardhat import we use console.log
    }

    modifier onlyOnwer() {
        // require(msg.sender == i_owner, "Hey, you are not the owner of the contract");
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _; //This helps to run the rest of the code in the function modifier is used
    }

    function fund() public payable {
        /*
        we want to set the minimum fund amount 
        Txn have
        Nonce, gas price, gas limit , to, value, data, v,r,s (components of txn signature)
        Function can also have similar functionalities
        Smart Contract addresses can also hold funds just like the wallets
        */

        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "Didn't send enough eth"
        ); // 1e18 = 1*10**18 This value is 1eth or number of weis present in eth

        /*
        this msg.value is the first parameter of the function and in the bracket goes as a second parameter
        msg.value returns the value in terms of wei
        
        chainlink or oracles play their part to bring off chain data
        blockchain oracle - get the off chain data and help interacting smart contracts with real world
        chainlink oracle is the solution to this which is decentralized 
        We can't call an API in smart contracts as for executing this nodes need to break the consensus
        */
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] = msg.value;
        totalEth += msg.value;
    }

    function withdraw()
        public
        onlyOnwer
    /*This will need to fit the modifier first to run further*/
    {
        //only owner should call withdraw function
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            //Looping through the address array and mapping to set the balances to 0
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        /*
        reset the array
        also withdraw the funds
        */

        //We can reset the array by other method without looping
        s_funders = new address[](0); //Here the mapping is not empited only the array is set to 0 mapping still have it keys as address and values as wallet money

        /*
        Withdrawing the funds can be done through
        Transfer
        Send
        call
        */

        /*
        Transfer - reverts if fails
        msg.sender = address
        payable(msg.sender) = payable address
        
        payable(msg.sender).transfer(address(this).balance);
        //Send - returns bool 
        bool sendSuccess = payable(msg.sender).send(address(this).balance);
        require(sendSuccess, "Send Failed"); //if send success is false then error message send failed is shown
        */

        //CALL IS RECOMMENDED NOW TO USE
        //call - lower level command and it is powerful it also returns bool
        (
            bool callSuccess, /*bytes memory dataReturned*/

        ) = payable(msg.sender).call{value: address(this).balance}('');
        require(callSuccess, 'Call Failed'); //if call success is false then error message call failed is shown
    }

    function cheaperWithdraw() public onlyOnwer {
        address[] memory funders = s_funders; //copying the array to memory
        //mappings can't be in memory
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0; //resetting funder mapping here
        }
        s_funders = new address[](0);
        (bool success, ) = i_owner.call{value: address(this).balance}('');
        require(success);
    }

    // What happens if someone sends this contract ETH without calling the fund function
    // receive() It should be external payable and doesn't use the function keyword and don't have any arguments or return statement
    // fallback()

    /*The receive method is used as a fallback function in a contract and is called when ether is sent to a contract with no calldata. 
    If the receive method does not exist, it will use the fallback function.*/
    // receive() external payable {
    //     fund();
    // }

    // fallback() external payable {
    //     fund();
    // }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(address funder)
        public
        view
        returns (uint256)
    {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}

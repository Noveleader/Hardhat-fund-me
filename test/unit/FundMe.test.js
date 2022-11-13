//This is for unit testing
const { deployments, ethers, getNamedAccounts } = require('hardhat')
const { assert, expect } = require('chai')
const { developmentChains } = require('../../helper-hardhat-config')

!developmentChains.includes(network.name)
    ? describe.skip
    : describe('FundMe', async function() {
          let fundMe
          let deployer
          let mockV3Aggregator
          const sendValue = ethers.utils.parseEther('1') //1 ETH in wei, using this we can revert ether to any unit - wei, gwei etc
          beforeEach(async function() {
              //deploy our fundMe contract
              //using Hardhat-deploy
              // const accounts = await ethers.getSigner() //get all the accounts listed with their public and private key
              // const accountZero = accounts[0] //get the first account
              //const { deployer } = await getNamedAccounts() //we just need the deployer through getNamedAccounts
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(['all']) //deploy all the scripts
              fundMe = await ethers.getContract('FundMe', deployer) //gives the most recent contract deployed state
              mockV3Aggregator = await ethers.getContract(
                  'MockV3Aggregator',
                  deployer
              )
          })
          //test just for the constructors
          describe('constructor', async function() {
              it('sets the aggregator addresses correctly', async function() {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })

          //test for the Fund function if enought eth comes in or not?
          describe('fund', async function() {
              it("Fails if you don't send enough ETH", async function() {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "Didn't send enough eth"
                  )
              })
              it('Updated the amount funded data structure', async function() {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })
              it('Adds funder to array of getFunder', async function() {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getFunder(0)
                  assert.equal(response, deployer)
              })
          })
          describe('withdraw', async function() {
              beforeEach(async function() {
                  await fundMe.fund({ value: sendValue })
              })

              it('withdraw ETH from a single founder', async function() {
                  // Arrange
                  const startingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  ) //ethers.provider.getBalance(fundMe.address) could also be used here but fundMe also have provider object
                  const startingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )
                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  //breakup point stops the scripts and take us to the debug console with the current set of variable
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice) //since it is a big number
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )
                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(), //to make it work well with the good numbers we have added add
                      endingDeployerBalance.add(gasCost).toString()
                  ) //gas is also there
              })

              it('allows us to withdraw with multiple getFunder', async function() {
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }

                  //Arrange
                  const startingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const startingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  //Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  //Assert
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  assert.equal(endingFundMeBalance, 0)
                  console.log(endingFundMeBalance)

                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(), //to make it work well with the good numbers we have added add
                      endingDeployerBalance.add(gasCost).toString()
                  )

                  //Make sure that the getFunder array is empty
                  expect(fundMe.getFunder(0)).to.be.revertedWith

                  for (let j = 1; j < 6; j++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[j].address
                          ),
                          0
                      )
                  }
              })

              it('Only allows the owner to withdraw', async function() {
                  const accounts = await ethers.getSigners()
                  const fundMeConnectedContract = await fundMe.connect(
                      accounts[1]
                  )
                  await expect(
                      fundMeConnectedContract.withdraw()
                  ).to.be.revertedWithCustomError(fundMe, 'FundMe__NotOwner')
              })

              it('cheaper withdraw testing...', async function() {
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }

                  //Arrange
                  const startingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const startingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  //Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  //Assert
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  assert.equal(endingFundMeBalance, 0)
                  console.log(endingFundMeBalance)

                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(), //to make it work well with the good numbers we have added add
                      endingDeployerBalance.add(gasCost).toString()
                  )

                  //Make sure that the getFunder array is empty
                  expect(fundMe.getFunder(0)).to.be.revertedWith

                  for (let j = 1; j < 6; j++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[j].address
                          ),
                          0
                      )
                  }
              })
          })
      })

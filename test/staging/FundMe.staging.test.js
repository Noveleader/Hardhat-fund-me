const { getNamedAccounts, ethers, network } = require('hardhat')
const { assert, expect } = require('chai')
const { developmentChains } = require('../../helper-hardhat-config')

// let variable = true
// let someVar = variable ? 'yes' : 'no'
developmentChains.includes(network.name)
    ? describe.skip
    : describe('FundMe', async function() {
          // only runs if we are not on development chain
          let fundMe
          let deployer
          const sendValue = ethers.utils.parseEther('0.1')
          beforeEach(async function() {
              deployer = (await getNamedAccounts()).deployer
              fundMe = await ethers.getContract('FundMe', deployer)
          })

          it('allows people to fund and withdraw', async function() {
              await fundMe.fund({ value: sendValue })
              const transactionResponse = await fundMe.withdraw()
              const transactionReceipt = await transactionResponse.wait(1)
              const endingBalance = await fundMe.provider.getBalance(
                  fundMe.address
              )
              assert.equal(endingBalance.toString(), '0')
          })
      })

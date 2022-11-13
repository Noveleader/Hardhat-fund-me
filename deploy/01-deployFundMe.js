// function deployFunc() {
//     console.log('Deploying FundMe...')
// }

// module.exports.default = deployFunc
const { network } = require('hardhat')
require('hardhat-deploy')
require('dotenv').config()
const {
    networkConfig,
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER
} = require('../helper-hardhat-config')

module.exports = async function({ getNamedAccounts, deployments }) {
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    const { verify } = require('../utils/verify')
    /*
    We can do something like this
    If chainId is X use address Y
    If chainId is Z use address A
    */
    /* so require gets the exported file used in the other file as module.exports*/
    // const { networkConfig } = require('../helper-hardhat-config')
    // const ethUsdPriceFeedAddress = networkConfig[chainId]['ethUsdPriceFeed']
    let ethUsdPriceFeedAddress
    if (developmentChains.includes(network.name)) {
        const ethUsdAggreagator = await get('MockV3Aggregator')
        ethUsdPriceFeedAddress = ethUsdAggreagator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]['ethUsdPriceFeed']
    }
    const args = [ethUsdPriceFeedAddress]
    const fundMe = await deploy('FundMe', {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1
    })
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args)
    }
    // console.log(ethUsdPriceFeed)
    //if the contract doesn't exist, we deploy a minimal version of it for local testing - mocks
    // console.log(deploy) //[AsyncFunction: deploy]
    // console.log(log) //[Function: log]
    // console.log(deployer) //0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
    // console.log(chainId) //31337
    // console.log(deployments)
    /*
    {
  readDotFile: [AsyncFunction: readDotFile],
  saveDotFile: [AsyncFunction: saveDotFile],
  deleteDotFile: [AsyncFunction: deleteDotFile],
  save: [AsyncFunction: save],
  delete: [AsyncFunction: delete],
  get: [AsyncFunction: get],
  getOrNull: [AsyncFunction: getOrNull],
  getDeploymentsFromAddress: [AsyncFunction: getDeploymentsFromAddress],
  all: [AsyncFunction: all],
  getArtifact: [AsyncFunction: getArtifact],
  getExtendedArtifact: [AsyncFunction: getExtendedArtifact],
  run: [Function: run],
  fixture: [AsyncFunction: fixture],
  createFixture: [Function: createFixture],
  log: [Function: log],
  getNetworkName: [Function: getNetworkName],
  getGasUsed: [Function: getGasUsed],
  fetchIfDifferent: [AsyncFunction: fetchIfDifferent],
  deploy: [AsyncFunction: deploy],
  diamond: { deploy: [AsyncFunction: diamond] },
  catchUnknownSigner: [AsyncFunction: catchUnknownSigner],
  execute: [AsyncFunction: execute],
  rawTx: [AsyncFunction: rawTx],
  read: [AsyncFunction: read],
  deterministic: [AsyncFunction: deterministic],
  call: [Function (anonymous)],
  sendTxAndWait: [Function (anonymous)],
  deployIfDifferent: [Function (anonymous)]
    }
    */
    // what do we do for differnt EVM chains
    //when going for local network we want to use a mock
    log('------------------------------------')
}

module.exports.tags = ['all', 'fundme']

/*
function speak() {
    return 'tum hi ho chutiya '
}
const person = {
    name: ['Bob', 'Smith'],
    age: 32,
    speak: speak
}

const { name, age } = person
console.log(name) //['Bob', 'Smith']
console.log(age) //32
console.log(speak)
console.log(person)
*/

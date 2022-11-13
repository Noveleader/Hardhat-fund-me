const { network } = require('hardhat')
const {
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER
} = require('../helper-hardhat-config')
require('hardhat-deploy')
module.exports = async function({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    // const chainId = network.config.chainId
    // in if condition we can also use (chainId === '31337')
    if (developmentChains.includes(network.name)) {
        log('local network detected! Deploying mocks...')
        await deploy('MockV3Aggregator', {
            contract: 'MockV3Aggregator',
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER]
        })
        log('Mocks Deployed!')
        log('------------------------------------')
    }
}

module.exports.tags = ['all', 'mocks']

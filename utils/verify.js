const { run } = require('hardhat')
// const { modules } = require('Web3')

const verify = async function verify(contractAddress, args) {
    console.log('Verifying contract...')
    try {
        await run('verify:verify', {
            address: contractAddress,
            constructorArguments: args
        })
    } catch (error) {
        if (error.message.toLowerCase().includes('already verified')) {
            console.log('Contract already verified')
        } else {
            console.log(error)
        }
    }
}

module.exports = { verify }

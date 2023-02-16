const { network } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config.js")
const { verify } = require("../utils/verify")
const fs =require("fs")

module.exports = async function({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    log("-----------------------")

    const chainId = network.config.chainId
    let ethUsdAddress

    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await ethers.getContract("MockV3Aggregator")
        ethUsdAddress = ethUsdAggregator.address
    }

    if (!developmentChains.includes(network.name)) {
        ethUsdAddress = networkConfig[chainId].ethUsdPriceFeed
    } 

    const lowSVG = fs.readFileSync('./images/dynamicNft/frown.svg', {encoding: "utf8"})
    const highSVG = fs.readFileSync('./images/dynamicNft/happy.svg', {encoding: "utf8"})

    const args = [ethUsdAddress, lowSVG, highSVG]
    const dynamicSvgNft = await deploy("DynamicSVGNFT", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(dynamicSvgNft.address, args)
    }
}

module.exports.tags = ["all", "dynamicsvgnft", "main"]

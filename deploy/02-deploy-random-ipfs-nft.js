const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config.js")
const { verify } = require("../utils/verify")
const { storeImages, storeTokenURIMetadata } = require("../utils/uploadToPinata")

// Because this contract use chainlink, we gonna need to create a mock to replicate it.

const metadataTemplate = {
    name: "",
    description: "",
    image: "",
    attributes: []
}

module.exports = async function({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    let vrfCoordinatorV2Address, subId, tokenURIs, vrfCoordinatorV2Mock

    // Get the IPFS hashes of our images
    if (process.env.UPLOAD_TO_PINATA === "true") {
        tokenURIs = await handleTokenURIs()
    }

    if (developmentChains.includes(network.name)) {
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address

        const tx = await vrfCoordinatorV2Mock.createSubscription()
        const txReceipt = await tx.wait()

        subId = txReceipt.events[0].args.subId
        await vrfCoordinatorV2Mock.fundSubscription(subId, ethers.utils.parseUnits("0.9", "ether"))
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2
        subId = networkConfig[chainId].subscriptionId
    }

    log("--------------------")
    const args = [
        vrfCoordinatorV2Address,
        networkConfig[chainId].keyHash,
        subId,
        networkConfig[chainId].callbackGasLimit,
        tokenURIs,
        networkConfig[chainId].mintFee
    ]

    const randomIPFSNft = await deploy("RandomIPFSNFT", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmation: network.config.blockConfirmations || 1
    })

    if (developmentChains.includes(network.name)) {
        await vrfCoordinatorV2Mock.addConsumer(
            subId,
            randomIPFSNft.address
        )
    }

    log("--------------------")

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(randomIPFSNft.address, args)
    }
}

async function handleTokenURIs() {
    // Store the Image in IPFS
    // Store the metadata in IPFS
    tokenURIs = []

    const { responses: imageUploadReponses, files } = await storeImages("./images/randomNft/")
    for (imageUploadReponseIndex in imageUploadReponses) {
        let tokenURIMetadata = { ...metadataTemplate }
        tokenURIMetadata.name = files[imageUploadReponseIndex].replace(".png", "")
        tokenURIMetadata.description = `An adorable ${tokenURIMetadata.name} pup!`
        tokenURIMetadata.image = `ipfs://${imageUploadReponses[imageUploadReponseIndex].IpfsHash}`
        console.log(`Uploading ${tokenURIMetadata.name}...`)

        const metadataUploadResponse = await storeTokenURIMetadata(tokenURIMetadata)
        tokenURIs.push(`ipfs://${metadataUploadResponse.IpfsHash}`)
    }

    console.log("Token URIs uploaded !")
    return tokenURIs
}

module.exports.tags = ["all", "randomipfs", "main"]

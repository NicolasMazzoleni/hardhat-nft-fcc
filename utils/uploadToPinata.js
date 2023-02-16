const pinataSDK = require("@pinata/sdk")
const path = require("path")
const fs = require("fs")
require("dotenv").config()

const pinata = new pinataSDK({
    pinataApiKey: process.env.PINATA_API_KEY,
    pinataSecretApiKey: process.env.PINATA_API_SECRET_KEY
})

async function storeImages(imagesFilePath) {
    const fullImagesPath = path.resolve(imagesFilePath)
    const files = fs.readdirSync(fullImagesPath)
    let responses = []
    console.log("Uploading to Pinata!")
    for (fileIndex in files) {
        console.log(`Working on ${files[fileIndex]}...`)
        const finalPath = `${fullImagesPath}/${files[fileIndex]}`
        const readableStream = fs.createReadStream(finalPath)
        const options = {
            pinataMetadata: {
                name: files[fileIndex]
            }
        }
        try {
            const response = await pinata.pinFileToIPFS(readableStream, options)
            responses.push(response)
        } catch (e) {
            console.log("e ", e)
        }
    }

    return { responses, files }
}

async function storeTokenURIMetadata(metadata) {
    try {
        response = await pinata.pinJSONToIPFS(metadata)
        return response
    } catch (e) {
        console.log("e ", e)
    }

    return
}

module.exports = { storeImages, storeTokenURIMetadata }

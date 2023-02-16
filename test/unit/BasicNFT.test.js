const { assert } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("BasicNFT Unit Tests", async function() {
          let basicNft
          let deployer
          beforeEach(async function() {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["BasicNFT"])
              basicNft = await ethers.getContract("BasicNFT")
          })

          describe("contructor", async function() {
              it("Initialize the NFT", async () => {
                  assert.equal(await basicNft.name(), "Doggie")
                  assert.equal(await basicNft.symbol(), "DOG")
              })
          })

          describe("mintNFT", async () => {
              beforeEach(async function() {
                  const tx = await basicNft.mintNft()
                  await tx.wait(1)
              })
              it("Get Token URI  and counter values", async () => {
                  const tokenURI = await basicNft.tokenURI(0)
                  const tokenCounter = await basicNft.getTokenCOunter()

                  assert.equal(tokenURI, await basicNft.TOKEN_URI())
                  assert.equal(tokenCounter.toString(), "1")
              })

              it("Get correct balance of owner", async () => {
                  const owner = deployer.address
                  const ownerBalance = await basicNft.balanceOf(owner)

                  assert.equal(ownerBalance.toString(), "1")
                  assert.equal(owner, await basicNft.ownerOf(0))
              })
          })
      })

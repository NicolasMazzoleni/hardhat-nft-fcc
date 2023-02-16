const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Random IPFS NFT Unit Tests", function() {
          let randomIPFSNft, vrfCoordinatorV2Mock, deployer

          beforeEach(async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["mocks", "randomipfs"])
              randomIPFSNft = await ethers.getContract("RandomIPFSNFT")
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
          })

          describe("constructor", function() {
              it("initializes the contract correctly", async () => {
                  const dogTokenURI = await randomIPFSNft.getDogTokenUris(0)
                  const mintFee = await randomIPFSNft.getMintFee()
                  const tokenCounter = await randomIPFSNft.getTokenCounter()

                  assert.include(dogTokenURI, "ipfs://")
                  assert.equal(mintFee.toString(), "10000000000000000")
                  assert.equal(tokenCounter.toString(), "0")
              })
          })

          describe("requestNft", function() {
              it("Revert if value is null", async () => {
                  await expect(randomIPFSNft.requestNft()).to.be.revertedWith(
                      "RandomIPFSNFT__NeedMoreETHSent"
                  )
              })

              it("Revert if value is less than mintFee", async () => {
                  const mintFee = await randomIPFSNft.getMintFee()
                  const value = mintFee.sub(ethers.utils.parseUnits("0.01", "ether"))
                  await expect(
                      randomIPFSNft.requestNft({ value: value.toString() })
                  ).to.be.revertedWith("RandomIPFSNFT__NeedMoreETHSent")
              })

              it("Emits the event nftRequested", async function() {
                  const mintFee = await randomIPFSNft.getMintFee()
                  await expect(randomIPFSNft.requestNft({ value: mintFee.toString() })).to.emit(
                      randomIPFSNft,
                      "nftRequested"
                  )
              })
          })

          describe("getRaceFromRandomNumber", function() {
              it("Return 1 because the number is < 10", async () => {
                  const expectedValue = await randomIPFSNft.getRaceFromRandomNumber(7)
                  assert.equal("0", expectedValue)
              })

              it("Return 2 because the number is < 30", async () => {
                  const expectedValue = await randomIPFSNft.getRaceFromRandomNumber(14)
                  assert.equal("1", expectedValue)
              })

              it("Return 3 because the number is < 99", async () => {
                  const expectedValue = await randomIPFSNft.getRaceFromRandomNumber(82)
                  assert.equal("2", expectedValue)
              })

              it("Revert if the number is > 99", async () => {
                  await expect(randomIPFSNft.getRaceFromRandomNumber(104)).to.be.revertedWith(
                      "RandomIPFSNFT__RangeOutOfBound"
                  )
              })
          })

          describe("fulfillRandomWords", () => {
              it("mints NFT after random number is returned", async function() {
                  await new Promise(async (resolve, reject) => {
                      randomIPFSNft.once("NftMinted", async () => {
                          try {
                              const tokenUri = await randomIPFSNft.tokenURI("0")
                              const tokenCounter = await randomIPFSNft.getTokenCounter()
                              assert.equal(tokenUri.toString().includes("ipfs://"), true)
                              assert.equal(tokenCounter.toString(), "1")
                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      try {
                          const fee = await randomIPFSNft.getMintFee()
                          const requestNftResponse = await randomIpfsNft.requestNft({
                              value: fee.toString()
                          })
                          const requestNftReceipt = await requestNftResponse.wait(1)
                          const response = await vrfCoordinatorV2Mock.fulfillRandomWords(
                              requestNftReceipt.events[1].args.requestId,
                              randomIPFSNft.address
                          )
                          console.log("response ", response)
                      } catch (e) {
                          console.log(e)
                          reject(e)
                      }
                  })
              }).timeout(100000)
          })
      })

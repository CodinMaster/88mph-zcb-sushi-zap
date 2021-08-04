import { ethers, network, waffle } from "hardhat";
import { parseEther } from "@ethersproject/units";
import { AddressZero, MaxUint256, HashZero } from "@ethersproject/constants";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Signer } from "ethers";
import { solidity } from "ethereum-waffle";
import chai from "chai";

chai.use(solidity);
const { expect } = chai;
const { deployContract } = waffle;

// artifacts
import ZapArtifact from "../artifacts/contracts/ZCB_Sushi_Zap.sol/ZCB_Sushi_Zap.json";
import SushiRouterArtifact from "../artifacts/contracts/TestHelpers/ISushiRouter.sol/ISushiRouter.json";
import IERC20Artifact from "../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json";

// types
import { ZCBSushiZap, ISushiRouter, IERC20 } from "../typechain";

describe("ZCB_Sushi_Zap", () => {
  let zap: ZCBSushiZap;
  let sushiRouter: ISushiRouter;
  let UNIToken: IERC20;
  let SLPToken: IERC20;
  let MPHToken: IERC20;

  let deployer: SignerWithAddress;
  let user: SignerWithAddress;

  // addresses
  const sushiRouterAddress = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F";
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const UNI = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";
  const UNIDInterest = "0x19E10132841616CE4790920d5f94B8571F9b9341";
  const zcbUNI = "0x85034b3b2e292493d029443455cc62ab669573b3"; // Feb '22 deadline
  const SLP = "0xCB556442104340490EcBF6AF44909F59D4E7E509"; // UNI/ZCB sushi lp
  const MPH = "0x8888801aF4d980682e47f1A9036e589479e835C5";

  let uniBalance: BigNumber;
  let mphBalance: BigNumber;

  before(async () => {
    [deployer, user] = await ethers.getSigners();

    // deploy contracts
    zap = (await deployContract(deployer, ZapArtifact)) as ZCBSushiZap;
    sushiRouter = (await ethers.getContractAt(
      SushiRouterArtifact.abi,
      sushiRouterAddress
    )) as ISushiRouter;
    UNIToken = (await ethers.getContractAt(IERC20Artifact.abi, UNI)) as IERC20;
    SLPToken = (await ethers.getContractAt(IERC20Artifact.abi, SLP)) as IERC20;
    MPHToken = (await ethers.getContractAt(IERC20Artifact.abi, MPH)) as IERC20;

    // get UNI tokens
    await sushiRouter
      .connect(user)
      .swapExactETHForTokens(0, [WETH, UNI], user.address, MaxUint256, {
        value: parseEther("1"),
      });
    uniBalance = await UNIToken.balanceOf(user.address);
    // get MPH tokens
    await sushiRouter
      .connect(user)
      .swapExactETHForTokens(0, [WETH, MPH], user.address, MaxUint256, {
        value: parseEther("1"),
      });
    mphBalance = await MPHToken.balanceOf(user.address);
  });

  it("should mint ZCB/UNI sushi lp tokens from UNI", async () => {
    const preSLPBalance = await SLPToken.balanceOf(user.address);

    // approve contract to spend UNI & MPH
    await UNIToken.connect(user).approve(zap.address, uniBalance);
    await MPHToken.connect(user).approve(zap.address, mphBalance);

    const maturationTimestamp =
      Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60; // 14 days from now
    await zap
      .connect(user)
      .Zap(UNI, uniBalance, UNIDInterest, maturationTimestamp, zcbUNI);

    const postSLPBalance = await SLPToken.balanceOf(user.address);
    expect(postSLPBalance).to.be.gt(preSLPBalance);
  });
});

import { ethers } from "hardhat";

async function main() {
  const fundraisingGoal = ethers.utils.parseEther("1");

  const FundraisingContract = await ethers.getContractFactory(
    "FundraisingToken"
  );

  const contract = await FundraisingContract.deploy(fundraisingGoal);

  await contract.deployed();

  console.log(
    `FundraisingGoal contract has been deployed to address: ${contract.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

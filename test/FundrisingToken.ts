import { ethers, network } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

const FUNDRISING_GOAL = "1000000000000000000"; // 1 ETH

describe("FundrisingToken contract", function () {
  async function deployTokenFixture() {
    const FundrisingToken = await ethers.getContractFactory("FundrisingToken");
    const [owner, addr1, addr2] = await ethers.getSigners();

    const hardhatToken = await FundrisingToken.deploy(FUNDRISING_GOAL);

    await hardhatToken.deployed();

    // Fixtures can return anything you consider useful for your tests
    return { FundrisingToken, hardhatToken, owner, addr1, addr2 };
  }

  describe("ERC20 constructed contract properties", function () {
    it("name method returns proper token name", async () => {
      const { hardhatToken } = await loadFixture(deployTokenFixture);

      expect(await hardhatToken.name()).to.equal("Foundraised Token");
    });

    it("symbol method returns proper token name", async () => {
      const { hardhatToken } = await loadFixture(deployTokenFixture);

      expect(await hardhatToken.symbol()).to.equal("FRT");
    });

    it("decimals method returns 18 (the same as ETH decimals)", async () => {
      const { hardhatToken } = await loadFixture(deployTokenFixture);

      expect(await hardhatToken.decimals()).to.equal(18);
    });
  });

  describe("Foundrising functions", function () {
    it("foundrisingGoal returns " + FUNDRISING_GOAL, async () => {
      const { hardhatToken } = await loadFixture(deployTokenFixture);

      expect(await hardhatToken.fundrisingGoal()).to.equal(FUNDRISING_GOAL);
    });
    describe("mint()", () => {
      it("Reverts transactions when nothing has been paid.", async () => {
        const { hardhatToken, addr1 } = await loadFixture(deployTokenFixture);
        await expect(hardhatToken.connect(addr1).mint()).to.be.revertedWith(
          "Transaction without value."
        );
      });

      it("Allows to mint tokens for ETH in 1:1 ration when the goal is not achieved", async () => {
        const { hardhatToken, addr1 } = await loadFixture(deployTokenFixture);

        const TRANSACTION_VALUE = "100000";

        await hardhatToken.connect(addr1).mint({ value: TRANSACTION_VALUE });

        await expect(await hardhatToken.balanceOf(addr1.address)).to.be.equal(
          TRANSACTION_VALUE
        );
      });

      it(`Allows to mint tokens up to ${FUNDRISING_GOAL} limit and returns overpaid coins `, async () => {
        const { hardhatToken, addr2 } = await loadFixture(deployTokenFixture);

        const TWO_ETH = "2000000000000000000"; // 1 ETH and 1000 wei
        const ONE_ETH = "1000000000000000000"; // 1 ETH and 1000 wei
        const _99_ETH = "99000000000000000000"; // 1 ETH and 1000 wei

        //setBalance to 100 ETH
        await network.provider.send("hardhat_setBalance", [
          addr2.address,
          "0x56BC75E2D63100000", // 100 ETH
        ]);

        await hardhatToken.connect(addr2).mint({ value: TWO_ETH });

        await expect(await hardhatToken.balanceOf(addr2.address)).to.be.equal(
          ONE_ETH
        );

        await expect(
          await ethers.provider.getBalance(hardhatToken.address)
        ).to.be.equal(ONE_ETH);

        await expect(
          String(await ethers.provider.getBalance(addr2.address)).slice(0, 4)
        ).to.be.equal("9899"); // It's not 9900... because of a gas fees
      });
    });
  });

  // it("Deployment should assign the total supply of tokens to the owner", async function () {
  //   const { hardhatToken, owner } = await loadFixture(deployTokenFixture);

  //   const ownerBalance = await hardhatToken.balanceOf(owner.address);
  //   expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
  // });

  // it("Should transfer tokens between accounts", async function () {
  //   const { hardhatToken, owner, addr1, addr2 } = await loadFixture(
  //     deployTokenFixture
  //   );

  //   // Transfer 50 tokens from owner to addr1
  //   await hardhatToken.transfer(addr1.address, 50);
  //   expect(await hardhatToken.balanceOf(addr1.address)).to.equal(50);

  //   // Transfer 50 tokens from addr1 to addr2
  //   await hardhatToken.connect(addr1).transfer(addr2.address, 50);
  //   expect(await hardhatToken.balanceOf(addr2.address)).to.equal(50);
  // });
});

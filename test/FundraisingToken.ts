import { ethers, network } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ContractTransaction } from "ethers";

const FUNDRAISING_GOAL = ethers.utils.parseEther("1");

// TODO: you might replace it with ethers.utils.parseEther
const HALF_ETC = ethers.utils.parseEther("0.5");
const ONE_ETH = ethers.utils.parseEther("1");
const TWO_ETH = ethers.utils.parseEther("2");

describe("contract FundraisingToken ", async function () {
  async function deployTokenFixture() {
    const FundraisingToken = await ethers.getContractFactory(
      "FundraisingToken"
    );
    const [owner, addr1, addr2] = await ethers.getSigners();

    const hardhatToken = await FundraisingToken.deploy(FUNDRAISING_GOAL);

    await hardhatToken.deployed();

    // Fixtures can return anything you consider useful for your tests
    return { FundraisingToken, hardhatToken, owner, addr1, addr2 };
  }

  describe("ERC20 constructed contract properties", async function () {
    it("name method returns proper token name", async () => {
      const { hardhatToken } = await loadFixture(deployTokenFixture);

      expect(await hardhatToken.name()).to.equal("Fundraised Token");
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

  it(
    "FundraisingToken.fundraisingGoal() returns " + FUNDRAISING_GOAL,
    async () => {
      const { hardhatToken } = await loadFixture(deployTokenFixture);

      expect(await hardhatToken.fundraisingGoal()).to.equal(FUNDRAISING_GOAL);
    }
  );

  describe("FundraisingToken.mint()", async () => {
    it("Reverts transactions when nothing has been paid.", async () => {
      const { hardhatToken, addr1 } = await loadFixture(deployTokenFixture);

      await expect(hardhatToken.connect(addr1).mint()).to.be.revertedWith(
        "Transaction without value."
      );
    });

    it("Allows to mint tokens for ETH in 1:1 ration when the goal is not achieved", async () => {
      const TRANSACTION_VALUE = "100000";

      const { hardhatToken, addr1 } = await loadFixture(deployTokenFixture);

      await hardhatToken.connect(addr1).mint({ value: TRANSACTION_VALUE });

      await expect(await hardhatToken.balanceOf(addr1.address)).to.be.equal(
        TRANSACTION_VALUE
      );
    });

    describe("When the over goal payment has been paid", async () => {
      let mintTransaction: Promise<ContractTransaction>;

      it(`Emit GoalAchieved event`, async () => {
        const { hardhatToken, addr1 } = await loadFixture(deployTokenFixture);

        mintTransaction = hardhatToken.connect(addr1).mint({ value: TWO_ETH });

        await expect(mintTransaction).to.emit(hardhatToken, "GoalAchieved");
      });

      it(`The sender ERC20 token balance is equals balance ${FUNDRAISING_GOAL} limit`, async () => {
        const { hardhatToken, addr1 } = await loadFixture(deployTokenFixture);

        await hardhatToken.connect(addr1).mint({ value: TWO_ETH });

        await expect(await hardhatToken.balanceOf(addr1.address)).to.be.equal(
          ONE_ETH
        );
      });

      it(`The contract ETH balance is equals ONE_ETH`, async () => {
        const { hardhatToken, addr1 } = await loadFixture(deployTokenFixture);

        await hardhatToken.connect(addr1).mint({ value: TWO_ETH });

        await expect(
          await ethers.provider.getBalance(hardhatToken.address)
        ).to.be.at.least(ONE_ETH);
      });

      it(`Overpaid coins are returned to the sender`, async () => {
        const { hardhatToken, addr1 } = await loadFixture(deployTokenFixture);

        await network.provider.send("hardhat_setBalance", [
          addr1.address,
          "0x56BC75E2D63100000", // 100 ETH
        ]);

        await hardhatToken.connect(addr1).mint({ value: TWO_ETH });

        await expect(
          String(await ethers.provider.getBalance(addr1.address)).slice(0, 4)
        ).to.be.equal("9899"); // It's not 9900... because of the gas fees
      });
    });

    it(`Transaction reverted when ${FUNDRAISING_GOAL} limit has been achieved`, async () => {
      const { hardhatToken, addr1 } = await loadFixture(deployTokenFixture);

      // - Can't mint when the goal is achieved.
      await expect(
        hardhatToken.connect(addr1).mint({ value: FUNDRAISING_GOAL })
      ).to.be.not.reverted;

      await expect(
        hardhatToken.connect(addr1).mint({ value: "1" })
      ).to.be.revertedWith("Fundraising goal achieved. You cannot mint more!");
    });
  });

  describe(`FundraisingToken.withdrawFunds()`, async () => {
    it("The owner can't withdraw when the goal is not achieved", async () => {
      const { hardhatToken, owner, addr1 } = await loadFixture(
        deployTokenFixture
      );

      await hardhatToken.connect(addr1).mint({ value: HALF_ETC });

      expect(hardhatToken.connect(owner).withdrawFunds()).to.be.revertedWith(
        "Fundraising goal is not achieved!"
      );
    });

    it("Emit event GoalAchieved when the funds are withdrawn.", async () => {
      const { hardhatToken, owner, addr1 } = await loadFixture(
        deployTokenFixture
      );

      await hardhatToken.connect(addr1).mint({ value: FUNDRAISING_GOAL });

      expect(hardhatToken.connect(owner).withdrawFunds()).emit(
        hardhatToken,
        "CollectedFundsWithdrawnByOwner"
      );
    });

    it("The owner can withdrawFunds when the goal is achieved.", async () => {
      const { hardhatToken, owner, addr1 } = await loadFixture(
        deployTokenFixture
      );

      await network.provider.send("hardhat_setBalance", [
        owner.address,
        "0x6F05B59D3B20000", // 0.5 ETH - for gas
      ]);

      await hardhatToken.connect(addr1).mint({ value: TWO_ETH });

      await hardhatToken.connect(owner).withdrawFunds();

      expect(
        await ethers.provider.getBalance(hardhatToken.address)
      ).to.be.equal("0");

      expect(
        String(await ethers.provider.getBalance(owner.address)).slice(0, 2)
      ).to.be.equal("14");
    });
  });

  describe(`FundraisingToken.withdrawMyFunds()`, async () => {
    // - can withdraw when the goal is not achieved
    it("the fundraiser can withdraw funds when the goal is not achieved", async () => {
      const { hardhatToken, addr1 } = await loadFixture(deployTokenFixture);
      await network.provider.send("hardhat_setBalance", [
        addr1.address,
        "0x6F05B59D3B20000", // 0.5 ETH - for gas
      ]);

      await hardhatToken
        .connect(addr1)
        .mint({ value: ethers.utils.parseEther("0.4") });

      await hardhatToken.connect(addr1).withdrawMyFunds();

      await expect(
        await ethers.provider.getBalance(hardhatToken.address)
      ).to.be.equal("0");

      await expect(await hardhatToken.balanceOf(addr1.address)).to.be.equal(
        "0"
      );

      await expect(
        String(await ethers.provider.getBalance(addr1.address)).slice(0, 3)
      ).to.be.equal("499");
    });

    it("the fundraiser can not withdraw when the goal is achieved", async () => {
      const { hardhatToken, addr1 } = await loadFixture(deployTokenFixture);
      await network.provider.send("hardhat_setBalance", [
        addr1.address,
        "0x56BC75E2D63100000", // 100 ETH
      ]);

      await hardhatToken
        .connect(addr1)
        .mint({ value: ethers.utils.parseEther("1") });

      await expect(hardhatToken.connect(addr1).withdrawMyFunds()).rejectedWith(
        "Withdrawal impossible!"
      );
    });

    it("the fundraiser can not withdraw when the goal is achieved", async () => {
      const { hardhatToken, addr1 } = await loadFixture(deployTokenFixture);
      await network.provider.send("hardhat_setBalance", [
        addr1.address,
        "0x56BC75E2D63100000", // 100 ETH
      ]);

      await hardhatToken
        .connect(addr1)
        .mint({ value: ethers.utils.parseEther("1") });

      await network.provider.send("evm_increaseTime", [31536001]);

      await hardhatToken.connect(addr1).withdrawMyFunds();
      await expect(await hardhatToken.balanceOf(addr1.address)).to.be.equal(
        "0"
      );
    });
  });
});

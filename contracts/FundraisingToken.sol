//SPDX-License-Identifier: private

// We are using modern version of Solidity compiler therefore
// we don't need to use SafeMath here
pragma solidity ^0.8.9;

// Import ERC20 from the OpenZeppelin Contracts library
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * FundraisingToken contract is dedicated for people who want to collect exact amount of coins (ETH at ethereum chain).
 * During construction you need to set your target.
 * There is no time limit for how long the monay are collected at this implementation.
 * The funder can withdrow money in two cases:
 * - if the goal is not achieved yet
 * - if the goal has been achieved at least one year ago AND the money wasn't withdrawn yet by the owner.
 * The second condition is for security reason:
 * - if the owner would die or
 * - if the owner would transfer ownership to the wrong address
 *     the funds would be safe and withrawal would be possible again after a year.
 *
 * The (d)app can listen to (ERC20)Transfer events for following the collection progress.
 */
contract FundraisingToken is ERC20, Ownable, ReentrancyGuard {
    uint private _fundraisingGoal;

    // This is used for security purpose.
    // If the contract creater wouldn't spend the many within a year.
    // the people who funded the contract might withdrow it.
    uint private _fundraisingGoalAchivedDate = 0;

    // uint32 max = 4294967295 seconds ~ 136.1 years
    // 60 sec * 60 * 24 * 365 = 31536000 ~ one year
    uint32 constant WITHDRAW_NOT_SPENT_TIMEOUT = 31536000;

    bool private fundsWithdrawedByOwner = false;

    /**
     * @dev Emitted once when a fundrise goal is achieved.
     */
    event GoalAchieved();

    /**
     * @dev Emitted once when a fundrise goal is achieved.
     */
    event CollectedFundsWithdrawnByOwner();

    constructor(uint fundraisingGoal_) ERC20("Fundraised Token", "FRT") {
        require(0 != fundraisingGoal_);
        _fundraisingGoal = fundraisingGoal_;
    }

    function fundraisingGoal() external view returns (uint) {
        return _fundraisingGoal;
    }

    function mint() external payable nonReentrant {
        require(msg.value != 0, "Transaction without value.");

        require(
            _fundraisingGoalAchivedDate == 0,
            "Fundraising goal achieved. You cannot mint more!"
        );

        // Collect only as mach as _fundraisingGoal.
        if (totalSupply() + msg.value >= _fundraisingGoal) {
            uint amountLeftToFund = _fundraisingGoal - totalSupply();

            if (amountLeftToFund != msg.value) {
                (bool sent, ) = msg.sender.call{
                    value: msg.value - amountLeftToFund
                }("");
                require(sent, "Failed to sent back ether!");
            }

            _mint(msg.sender, amountLeftToFund);
            _fundraisingGoalAchivedDate = block.timestamp;
            emit GoalAchieved();
        } else {
            _mint(msg.sender, msg.value);
        }
    }

    // When the fundrise goal has been achieved
    // the Owner can withdraw everything
    // even those funds transfered by mistake to contract address
    function withdrawFunds() external onlyOwner {
        require(
            0 != _fundraisingGoalAchivedDate,
            "Fundraising goal is not achieved!"
        );
        require(
            0 != address(this).balance,
            "The contract balance equals zero!"
        );

        (bool sent, ) = msg.sender.call{value: address(this).balance}("");
        require(sent, "Failed to send Ether");

        fundsWithdrawedByOwner = true;
        emit CollectedFundsWithdrawnByOwner();
    }

    function withdrawMyFunds() external nonReentrant {
        // The token owner can withrdraw funds and burn the token when either:
        // 1. the goal wasn't achieved yet.
        // 2. the goal has been achieved more than year ago AND the owner didn't withdraw the funds
        require(
            _fundraisingGoalAchivedDate == 0 ||
                (!fundsWithdrawedByOwner &&
                    (_fundraisingGoalAchivedDate + WITHDRAW_NOT_SPENT_TIMEOUT >
                        block.timestamp))
        );

        uint balanceOfSender = balanceOf(msg.sender);

        (bool sent, ) = msg.sender.call{value: balanceOfSender}("");
        require(sent, "Failed to send Ether");

        _burn(msg.sender, balanceOfSender);
    }
}

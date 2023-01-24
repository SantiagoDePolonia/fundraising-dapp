//SPDX-License-Identifier: private

// We are using modern version of Solidity compiler therefore
// we don't need to use SafeMath here
pragma solidity ^0.8.9;

// Import ERC20 from the OpenZeppelin Contracts library
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * FundrisingToken contract is dedicated for people who want to collect exact amount of coins (ETH at ethereum chain).
 * During construction you need to set your target.
 * There is no time limit for how long the monay are collected at this implementation.
 * The funder can withdrow money in two cases:
 * - if the goal is not achieved yet
 * - if the goal has been achieved at least one year ago AND the money wasn't withdrawn yet by the owner.
 * The second condition is for security reason:
 * - if the owner would die or
 * - if the owner would transfer ownership to the wrong address
 *     the funds would be safe and withrawal would be possible again after a year.
 */
contract FundrisingToken is ERC20, Ownable, ReentrancyGuard {
    uint private _fundrisingGoal;

    // This is used for security purpose.
    // If the contract creater wouldn't spend the many within a year.
    // the people who funded the contract might withdrow it.
    uint private _fundrisingGoalAchivedDate = 0;

    // 60 sec * 60 * 24 * 365 = 31536000 ~ one year
    uint constant WITHDRAW_NOT_SPENT_TIMEOUT = 31536000;

    bool private fundsWithdrawedByOwner = false;

    /**
     * @dev Emitted once when a fundrise goal is achieved.
     */
    event GoalAchieved();

    /**
     * @dev Emitted once when a fundrise goal is achieved.
     */
    event CollectedFundsWithdrawedByOwner();

    constructor(uint fundrisingGoal_) ERC20("Foundraised Token", "FRT") {
        _fundrisingGoal = fundrisingGoal_;
    }

    function fundrisingGoal() external view returns (uint) {
        return _fundrisingGoal;
    }

    function mint() external payable nonReentrant {
        require(msg.value != 0, "Transaction without value.");

        // If the goal is achieved you cannot mint more tokens
        require(_fundrisingGoalAchivedDate == 0);

        // Collect only as mach as _fundrisingGoal.
        if (totalSupply() + msg.value >= _fundrisingGoal) {
            uint amountLeftToFund = _fundrisingGoal - totalSupply();

            if (amountLeftToFund != msg.value) {
                (bool sent, ) = msg.sender.call{
                    value: msg.value - amountLeftToFund
                }("");
                require(sent, "Failed to sent back ether!");
            }

            _mint(msg.sender, amountLeftToFund);
            _fundrisingGoalAchivedDate = block.timestamp;
            emit GoalAchieved();
        } else {
            _mint(msg.sender, msg.value);
        }
    }

    function withdrawFunds() external onlyOwner {
        require(!fundsWithdrawedByOwner);
        require(totalSupply() != 0);
        (bool sent, ) = msg.sender.call{value: totalSupply()}("");
        require(sent, "Failed to send Ether");
        emit CollectedFundsWithdrawedByOwner();
    }

    function withdrawMyFunds() external nonReentrant {
        // The token owner can withrdraw funds and burn the token when either:
        // 1. the goal wasn't achieved yet.
        // 2. the goal has been achieved more than year ago AND the owner didn't withdraw the funds
        require(
            _fundrisingGoalAchivedDate == 0 ||
                (!fundsWithdrawedByOwner &&
                    (_fundrisingGoalAchivedDate + WITHDRAW_NOT_SPENT_TIMEOUT >
                        block.timestamp))
        );

        uint balanceOfSender = balanceOf(msg.sender);

        (bool sent, ) = msg.sender.call{value: balanceOfSender}("");
        require(sent, "Failed to send Ether");

        _burn(msg.sender, balanceOfSender);
    }
}

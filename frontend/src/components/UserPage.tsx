
import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { BigNumber, ethers } from 'ethers';
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { FUNDRAISING_CONTRACT_ABI, FUNDRAISING_CONTRACT_ADDRESS } from '../constants';

import './UserPage.css';

// const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function calculateGoalProgress(fundraisingGoal: BigNumber, collected: BigNumber): number {
  return collected.mul(100).div(fundraisingGoal).toNumber();
}

function UserPage() {
  const [collected, setCollected] = useState<BigNumber>();
  const [goal, setGoal] = useState<BigNumber>();
  const [goalProgress, setGoalProgress] = useState<number>();
  const [donationInputValue, setDonationInputValue] = useState<number>(0.01);
  const [donatedByYou, setDonatedByYou] = useState<BigNumber>();
  const { address } = useAccount()

  const handleDonationInputOnChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
    setDonationInputValue(parseFloat(event?.target?.value));
  },[]);

  const {data: fundraisingGoal } = useContractRead({
    address: FUNDRAISING_CONTRACT_ADDRESS,
    abi: FUNDRAISING_CONTRACT_ABI,
    functionName: 'fundraisingGoal',
  });

  const {data: donatedBalance } = useContractRead({
    address: FUNDRAISING_CONTRACT_ADDRESS,
    abi: FUNDRAISING_CONTRACT_ABI,
    functionName: 'balanceOf',
    args: [address],
    watch: true,
  });

  const {data: totalCollected } = useContractRead({
    address: FUNDRAISING_CONTRACT_ADDRESS,
    abi: FUNDRAISING_CONTRACT_ABI,
    functionName: 'totalSupply',
    watch: true,
  });

  useEffect(() => {
    setGoal(fundraisingGoal as BigNumber);
  }, [fundraisingGoal])

  useEffect(() => {
    setCollected(totalCollected as BigNumber);
    
  }, [totalCollected, fundraisingGoal])

  useEffect(() => {
    setDonatedByYou(donatedBalance as BigNumber);
  }, [donatedBalance])

  useEffect(()=> {
    setGoalProgress(calculateGoalProgress(
      fundraisingGoal as BigNumber,
      totalCollected as BigNumber,
    ));
  }, [totalCollected, fundraisingGoal])

  const { config } = usePrepareContractWrite({
    address: FUNDRAISING_CONTRACT_ADDRESS,
    abi: FUNDRAISING_CONTRACT_ABI,
    functionName: 'mint',
    overrides: {
      value: ethers.utils.parseEther(donationInputValue.toString())
    }
  })

  const { write } = useContractWrite(config);

  const { config: configWithdraw } = usePrepareContractWrite({
    address: FUNDRAISING_CONTRACT_ADDRESS,
    abi: FUNDRAISING_CONTRACT_ABI,
    functionName: 'withdrawMyFunds'
  })

  const { write: writeWithdraw } = useContractWrite(configWithdraw);

  // Listen for events is not needed for now because I'm using useContractRead with watch flag

  // useContractEvent({
  //   address: FUNDRAISING_CONTRACT_ADDRESS,
  //   abi: FUNDRAISING_CONTRACT_ABI,
  //   eventName: 'GoalAchieved',
  //   once: true,
  //   listener() {
  //     setGoalProgress(100)
  //   },
  // });

  // useContractEvent({
  //   address: FUNDRAISING_CONTRACT_ADDRESS,
  //   abi: FUNDRAISING_CONTRACT_ABI,
  //   eventName: 'Transfer',
  //   listener(from, to, value, lastArgument) {

  //     if(ZERO_ADDRESS === from) {
  //       setCollected(collected?.add(value as BigNumber))
  //     } else if(ZERO_ADDRESS === to) {
  //       setCollected(collected?.sub(value as BigNumber))
  //     }
  //   },
  // });

  return (
    <>
      <div className='fundraising-status'>
        <h3>We collected: </h3>
        <div className='progress' style={{background: `linear-gradient(to right, #7B7 ${goalProgress}%, transparent 0%)`}}>
          {collected instanceof BigNumber && ethers.utils.formatEther(collected)}&nbsp;/&nbsp;
          {goal instanceof BigNumber && ethers.utils.formatEther(goal)}&nbsp;
          ETH
        </div>
        <h2>It's {goalProgress}% of our goal!</h2>
      </div>

      {goalProgress !== 100 &&
        <div className='donate'>
          <input type="number"
            value={donationInputValue}
            onChange={handleDonationInputOnChange}
            required name="price" min="0" step="0.001"
          />
          <button disabled={!write} onClick={() => write?.()}>
            Donate
          </button>
        </div>
      }
      {donatedByYou instanceof BigNumber &&
        ethers.utils.formatEther(donatedByYou) !== "0.0" &&
        goalProgress !== 100 &&
        <div className='cancel-donation'>
          <p>You donated: {donatedByYou instanceof BigNumber && ethers.utils.formatEther(donatedByYou)}&nbsp;</p>
          <button disabled={!writeWithdraw} onClick={() => writeWithdraw?.()}>
            Withdraw your donation
          </button>
        </div>
      }
    </>
  );
}

export default UserPage;

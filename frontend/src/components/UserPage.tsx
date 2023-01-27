
import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { BigNumber, ethers } from 'ethers';
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { FUNDRAISING_CONTRACT_ABI, FUNDRAISING_CONTRACT_ADDRESS } from '../constants';

// const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function calculateGoalProgress(fundraisingGoal: BigNumber, collected: BigNumber): number {
  return collected.mul(100).div(fundraisingGoal).toNumber();
}

function UserPage() {
  const [collected, setCollected] = useState<BigNumber>();
  const [goal, setGoal] = useState<BigNumber>();
  const [goalProgress, setGoalProgress] = useState<number>();
  const [donationInputValue, setDonationInputValue] = useState<number>(0.01);

  const { address } = useAccount()

  const handleDonationInputOnChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
    setDonationInputValue(parseFloat(event?.target?.value));
  },[]);

  const {data: fundraisingGoal } = useContractRead({
    address: FUNDRAISING_CONTRACT_ADDRESS,
    abi: FUNDRAISING_CONTRACT_ABI,
    functionName: 'fundraisingGoal',
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
      <div className='user-welcome-banner'>
        Hello <strong>{address}</strong>
      </div>

      <div className='fundraising-status'>
        <h3>We collected: {collected instanceof BigNumber && ethers.utils.formatEther(collected)} / {goal instanceof BigNumber && ethers.utils.formatEther(goal)} ETH</h3>
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
            Donate!
          </button>
        </div>
      }
    </>
  );
}

export default UserPage;

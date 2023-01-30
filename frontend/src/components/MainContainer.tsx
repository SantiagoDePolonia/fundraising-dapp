
import React from 'react';
import { Web3Button } from "@web3modal/react";
import "./MainContainer.css";
import { useAccount } from 'wagmi';
import UserPage from './UserPage';

function MainContainer() {
  const { address, isConnecting, isDisconnected } = useAccount()
 
  return (
    <div className="container">
      <header className="header">
        <div className="logo">
          <h1>Holiday fundraiser</h1>
          <h2>You have incredible opportunity to support my entertainment!</h2>
        </div>
        <Web3Button />
      </header>
      <main className='main'>
        <div className='status'>
          {isConnecting && <div>Connecting…</div>}
          {isDisconnected && <div>
            <Web3Button />
          </div>}
        </div>
        {address && <UserPage />}
      </main>
    </div>
  );
}

export default MainContainer;

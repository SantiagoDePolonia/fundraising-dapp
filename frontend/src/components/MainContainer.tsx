
import React from 'react';
import { Web3Button } from "@web3modal/react";
import "./MainContainer.css";

function MainContainer() {
  return (
    <div className="container">
      <header className="header">
        <div className="logo">
          <h1>Fundraising dApp</h1>
        </div>
        <Web3Button />
      </header>
    </div>
  );
}

export default MainContainer;

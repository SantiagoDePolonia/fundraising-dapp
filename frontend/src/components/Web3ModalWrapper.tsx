
import React, { useContext } from 'react';
import { Web3Button } from "@web3modal/react";
import { Web3Modal } from '@web3modal/react';
import { WagmiConfig } from 'wagmi';
import { WEB3_MODAL_PROJECT_ID } from '../constants';
import { EthersContext } from '../contexts/EthersContextProvider';
import MainContainer from './MainContainer';

function Web3ModalWrapper() {
  const {wagmiClient, ethereumClient} = useContext(EthersContext);

  return (
    <>
      <WagmiConfig client={wagmiClient}>
        <MainContainer />
      </WagmiConfig>
      <Web3Modal
        projectId={WEB3_MODAL_PROJECT_ID}
        ethereumClient={ethereumClient}
      />
    </>
  );
}

export default Web3ModalWrapper;

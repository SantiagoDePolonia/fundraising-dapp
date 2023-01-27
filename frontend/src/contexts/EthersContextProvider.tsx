import React from "react";

import {
  EthereumClient,
  modalConnectors,
  walletConnectProvider,
} from "@web3modal/ethereum";

import { configureChains, createClient } from "wagmi";

import { arbitrum, mainnet, polygon } from "wagmi/chains";
import { WEB3_MODAL_PROJECT_ID } from "../constants";

const chains = [arbitrum, mainnet, polygon];

// Wagmi client
const { provider } = configureChains(chains, [
  walletConnectProvider({ projectId: WEB3_MODAL_PROJECT_ID }),
]);

const wagmiClient = createClient({
  autoConnect: true,
  connectors: modalConnectors({ appName: "web3Modal", chains }),
  provider,
});

// Web3Modal Ethereum Client
const ethereumClient = new EthereumClient(wagmiClient, chains);

export const EthersContext = React.createContext({ provider, ethereumClient, wagmiClient });

interface EthersContextProviderProps {
  children: React.ReactNode
}

function EthersContextProvider(props: EthersContextProviderProps) {
  return (
    <EthersContext.Provider value={{ provider, ethereumClient, wagmiClient }}>
      {props.children}
    </EthersContext.Provider>
  );
}

export default EthersContextProvider;

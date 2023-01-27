import React from "react";

import {
  EthereumClient,
  modalConnectors,
  walletConnectProvider,
} from "@web3modal/ethereum";

import { configureChains, createClient } from "wagmi";

import { arbitrum, hardhat, mainnet, polygon } from "wagmi/chains";
import { WEB3_MODAL_PROJECT_ID } from "../constants";
import { getNetwork, JsonRpcProvider } from "@ethersproject/providers";

const CHAIN_ID=31337;
const RPC_URL="http://127.0.0.1:8545/";

const chains = [/*arbitrum, mainnet, polygon,*/ hardhat];
const hardhatEthProvider = new JsonRpcProvider(RPC_URL, getNetwork(CHAIN_ID));

// const client = createClient({
//     autoConnect: true,
//     provider: hardhatEthProvider,
//     connectors: [connector],
// });

// Wagmi client
const { provider } = configureChains(chains, [
  walletConnectProvider({ projectId: WEB3_MODAL_PROJECT_ID }),
]);

const wagmiClient = createClient({
  autoConnect: true,
  connectors: modalConnectors({ appName: "web3Modal", chains }),
  provider: hardhatEthProvider
  //  provider,
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

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { useAccount, WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import IPITdoggieNFT from '../contracts/IPITdoggieNFT.json';
import { polygon } from 'wagmi/chains';
import { readContract } from '@wagmi/core';
import './ChatMenu.css';

const queryClient = new QueryClient();

const projectId = process.env.REACT_APP_PROJECT_ID;
const metadata = {
  name: 'play.ipdoggie.com',
  description: 'IP&IT Doggie',
  url: 'https://play.ipdoggie.com',
  icons: ['https://play.ipdoggie.com/assets/paw-print.svg']
};

const wagmiConfig = defaultWagmiConfig({
  chains: [polygon],
  projectId,
  metadata,
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true
});

createWeb3Modal({
  wagmiConfig,
  projectId,
  enableAnalytics: true,
  themeMode: 'light',
  themeVariables: {
    '--w3m-color-mix' : 'rgb(234, 140, 46)',
    '--w3m-accent' : 'rgb(234, 140, 46)',
    '--wui-color-accent-base-100' : 'var(--w3m-accent)',
    '--wui-color-modal-bg-base' : '#191a1a',    
  }
});

const ChatMenu = () => {
  const [message, setMessage] = useState("");
  const [userNFTs, setUserNFTs] = useState([]);
  const [prevUserNFTs, setPrevUserNFTs] = useState([]);
  const [nftInfo, setNftInfo] = useState([]);

  const { isConnected, address } = useAccount();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
  const ipfsGateway = 'https://gateway.pinata.cloud/ipfs';

  const fetchUserNFTs = async () => {
    const ownerNfts = await Promise.all(Array.from({ length: 20 }, (_, i) =>
      readContract(wagmiConfig, {
        address: contractAddress,
        abi: IPITdoggieNFT.abi,
        functionName: 'ownerOf',
        args: [i + 1]
      })
    ));
    const userNFTs = ownerNfts.reduce((acc, ownerNft, index) => {
      if (ownerNft === address) {
        acc.push(index + 1);
      }
      return acc;
    }, []);
    setUserNFTs(userNFTs);
  };

  const getIPFSUrls = async () => {
    const ipfsUrls = await Promise.all(userNFTs.map(async (nftId) => {
      const infoNft = await readContract(wagmiConfig, {
        address: contractAddress,
        abi: IPITdoggieNFT.abi,
        functionName: 'tokenURI',
        args: [nftId]
      });
      return `${ipfsGateway}${infoNft.replace('ipfs:/', '')}`;
    }));
    return ipfsUrls;
  };

  const fetchIPFSFiles = async (ipfsUrls) => {
    const ipfsData = await Promise.all(ipfsUrls.map(async (ipfsUrl) => {
      try {
        const response = await axios.get(ipfsUrl);
        return response.data;
      } catch (error) {
        console.error(`Failed to fetch data from ${ipfsUrl}: ${error.message}`);
        return null;
      }
    }));
    return ipfsData.filter(Boolean);
  };

  const fetchNFTInfo = async () => {
    try {
      const ipfsUrls = await getIPFSUrls();
      const ipfsData = await fetchIPFSFiles(ipfsUrls);
      setNftInfo(ipfsData.map(data => ({
        name: data.name,
        description: data.description,
        image:  fixIpfsUrl(data.image)
      })));
    } catch (error) {
      console.error("Error fetching NFT info:", error);
    }
  };

  const fixIpfsUrl = (ipfsUrl) => {
    return ipfsUrl.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
  };

  const fetchData = async () => {
    const balance = await readContract(wagmiConfig, {
      address: contractAddress,
      abi: IPITdoggieNFT.abi,
      functionName: 'balanceOf',
      args: [address]
    });
    const cleanedBalance = balance ? balance.toString().replace('n', '') : '';
    if (cleanedBalance && parseInt(cleanedBalance) > 0) {
      fetchUserNFTs();
    } else {
      setMessage("Welcome! And now, let's learn how to get authentic IP&IT Doggy NFTs for you to start chatting.\n" +
    "Just ask the Doggie ૮⍝• ᴥ •⍝ა");
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchData();
      setMessage("");
    } else {
      setMessage("Please, login using your crypto-wallet");
    }
  }, [isConnected]);

  useEffect(() => {
    if (userNFTs.length > 0 && userNFTs !== prevUserNFTs) {
      fetchNFTInfo();
      setPrevUserNFTs(userNFTs);

      localStorage.setItem('userNFTs', JSON.stringify(userNFTs));
    }
  }, [userNFTs, prevUserNFTs]);

  return (
    <div className="chat-menu">
      <div className="chat-menu-btn">
        <div className='chat-menu-message'>{message}</div>
        <w3m-button />
      </div>
      {isConnected && nftInfo.map((nft, index) => (
        <div key={index} className='nft-container'>
          <img src={nft.image} alt={nft.name} />
          <h3 className='nft-name'>{nft.name}</h3>
          <p className='nft-description'>{nft.description}</p>
        </div>
      ))}
    </div>
  );
};

const Wallet = () => {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ChatMenu />
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default Wallet;

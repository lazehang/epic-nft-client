import React, { useEffect, useState } from 'react';
import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import { ethers } from "ethers";
import myEpicNft from './utils/MyEpicNFT.json';

// Constants
const TWITTER_HANDLE = 'lazeh4ng';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK = 'https://testnets.opensea.io/collection/squarenft-om7oooqhyo';
const TOTAL_MINT_COUNT = 50;
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");

  const [loading, setLoading] = useState(false);

  const [nftLinks, setNftLinks] = useState([])
  
  const checkIfWalletIsConnected = async () => {
    /*
    * First make sure we have access to window.ethereum
    */
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have metamask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' });

    /*
    * User can have multiple authorized accounts, we grab the first one if its there!
    */
    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
    } else {
      console.log("No authorized account found");
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      /*
      * Fancy method to request access to account.
      */
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      let chainId = await ethereum.request({ method: 'eth_chainId' });
      console.log("Connected to chain " + chainId);
      
      // String, hex code of the chainId of the Rinkebey test network
      const rinkebyChainId = "0x4"; 
      if (chainId !== rinkebyChainId) {
      	alert("You are not connected to the Rinkeby Test Network!");
      }

      /*
      * Boom! This should print out public address once we authorize Metamask.
      */
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  }

  const renderNotConnectedContainer = () => (
    <button className="cta-button connect-wallet-button" onClick={connectWallet}>
      Connect to Wallet
    </button>
  );

  const askContractToMintNft = async () => {  
    try {
      const { ethereum } = window;
  
      if (ethereum) {
        setLoading(true)
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);
  
        console.log("Going to pop wallet now to pay gas...")
        let nftTxn = await connectedContract.makeAnEpicNFT();
  
        console.log("Mining...please wait.")
        await nftTxn.wait();
        console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let connectedContract

    const onNewNftMinted = (from, tokenId) => {
      console.log(from, tokenId.toNumber())
      console.log(`Hey there! We've minted your NFT and sent it to your wallet. It may be blank right now. It can take a max of 10 min to show up on OpenSea. Here's the link: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`)
      setNftLinks(prevState => {
        return [
          ...prevState,
          `https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`
        ]
      })
    }

    const { ethereum } = window;

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

      connectedContract.on("NewEpicNFTMinted", onNewNftMinted);

      console.log("Setup event listener!")

    } else {
      console.log("Ethereum object doesn't exist!");
    }

    return () => {
        if (connectedContract) {
          connectedContract.off('NewEpicNFTMinted', onNewNftMinted)
        }
    }
  }, [])

  useEffect(() => {
    checkIfWalletIsConnected()
  }, [])
  
  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          {currentAccount === "" 
            ? renderNotConnectedContainer()
            : (
              <button disabled={loading} onClick={askContractToMintNft} className="cta-button connect-wallet-button">
                { loading ? 'Minting...' : 'Mint NFT' }
              </button>
            )
          }
          <div style={{ marginBottom: '15px' }}>
            <a
              target="_blank"
              rel="noreferrer"
              href={OPENSEA_LINK}
              style={{ color: '#fff', textDecoration: 'underline' }}
            >
              <span role="img" aria-label="open sea emoji" style={{ paddingRight: '5px', verticalAlign: 'bottom' }}>🌊</span> View Collection on OpenSea
            </a>
          </div>
        </div>

        <div>
          <ul style={{ listTypeStyle: 'none', paddingInlineStart: 0, maxWidth: '500px', margin: '0 auto'}}>
            {nftLinks.map((link, index) => (
              <li key={index} style={{ display: 'inline-block', padding: '0.5rem', border: '1px solid rgb(71 184 166)', borderRadius: '5px', marginBottom: '10px' }}>
                <a href={link} target="_blank" rel="noreferrer" style={{ color: '#03a9f4', outline: 'none', textDecoration: 'none', wordBreak: 'break-word' }}>{link}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
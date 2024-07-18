import React from "react";

import Script from "dangerous-html/react";
import { Helmet } from "react-helmet";
import { useState, useEffect } from "react";
import { Redirect } from 'react-router-dom'
import abi from "../contracts/Autocrate.json";
//import './App.css';
import { ethers } from "ethers";
import axios from "axios";

import "./home.css";
import Loginsystem from "./login";
import Share from "./Share";
import { useAppContext } from "../AppContext";
import Footer from "./Footer";


const Home = (props) => {
  const { state, setState } = useAppContext()
  const { provider, signer, contract, account, authenticated } = state;
  const [isConnected, setConnection] = useState(false);
  const [connectmsg, setMsg] = useState("Connect Wallet");
  // const [addresses, setAddresses] = useState([]);
  const [totalmints, setMints] = useState(0);
  const [nft_data, setNFTData] = useState([]);
  const [fetched_nftdata, setNFT] = useState(false);
  const [get_nft_cids, setNftCID] = useState([]);
  const [endorsed_mints, setEndorsingData] = useState([]);
  const [get_endorsed_cids, setEndorsedCid] = useState([]);
  const [total_endorsements, setTotalEndorsements] = useState(0);
  const [ipfs_hash, setHash] = useState();
  const [endorsementsAllowed, setEndorsementsAllowed] = useState(0);
  const [admin, setAdmin] = useState(false);
  const [selectedData, setSelectedData] = useState();
  const [verified, setVerified] = useState();
  const [verifiedURI, setVerifiedURI] = useState();
  const [verifiedData, setVerifiedData] = useState();
  const [currentChainId, setChainId] = useState();

  // const desiredChainId = 9090;
  const desiredChainId = 11155111;
  const nftipfsAddress = "https://ipfs.infura.io/ipfs/";

  const checkConnectionBeforeConnecting = () => {
    if(!isConnected){
      connectWallet();
    }
  }
  
  const connectWallet = async () => {
    const contractAddress = "0x70B066d68D78cF29f49f67eC2ecEa77877b26e25"//"0x8264a7B7d02ab5eF1e57d0ad10110686D79d8d46" //"0x70B066d68D78cF29f49f67eC2ecEa77877b26e25"
    const contractAbi = abi.abi;
    try {
      const { ethereum } = window;
      if (ethereum) {
        ethereum.on("chainChanged", () => {
          window.location.reload();
        });
        ethereum.on("accountsChanged", () => {
          window.location.reload();
        });
        const accounts = await ethereum.request({
          method: "eth_requestAccounts",
        });
        const account = accounts[0];
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();
        console.log(network.chainId);
        if(network.chainId != desiredChainId){
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${desiredChainId.toString(16)}` }], // Convert ID to hex string
            });

          } catch (switchError) {
            // Handle errors (e.g., user rejection, unsupported network)
            if (switchError.code === 4902) {
              console.log('User rejected network switch');
            } else if (switchError.code === -32602) {
              console.log('Network switch not supported');
            } else {
              console.error('Error switching network:', switchError);
            }
          }
        }
        if(network.chainId != desiredChainId){
          console.log("connect wallet");
          return ;
        }
        setMsg(account);
        setChainId(desiredChainId);
        const signer = provider.getSigner();
        setMsg(account);
        const contract = new ethers.Contract(
          contractAddress,
          contractAbi,
          signer
        );
        const authenticated = false;
        console.log(account)
        setState({ provider, signer, contract, account, authenticated });
        setConnection(true);
        const contractwithsigner = contract.connect(signer);
        const pass = await contractwithsigner.creds(account);
        if(pass !== undefined && pass !== ""){
          setAdmin(true);
        }
        const resp = await contractwithsigner.getTotalMints();
        const mints = resp.toNumber()
        setMints(mints);
        const endorsements_total = await contractwithsigner.total_endorsements();
        setTotalEndorsements(endorsements_total.toNumber());
        const nfts = await contractwithsigner.getTokenIdAccount(account);
        console.log('all nfts fetched');
        let nft_datas = [];
        let ipfs_cids = [];
        for(var i=0;i<nfts.length;i++){
          const tokenId = nfts[i].tokenId.toNumber();
          const ipfs_cid = await contractwithsigner.tokenURI(tokenId);
          console.log(ipfs_cid)
          ipfs_cids.push(ipfs_cid);
          nft_datas.push({"name": nfts[i].name, "description": nfts[i].description, "image": nftipfsAddress+nfts[i].imageuri})
          // await axios.get(nftipfsAddress+ipfs_cid).then((metadata) => {
          //   ipfs_cids.push(ipfs_cid);
          //   nft_datas.push(metadata.data);
          // });
        }
        console.log(nft_datas);
        const endorsed_nfts = await contractwithsigner.getTokenIdAccountSharing(account);
        let endorsed = [];
        let endorsed_ipfs = [];
        for(var i=0;i<endorsed_nfts.length;i++){
          const tokenId = endorsed_nfts[i].tokenId.toNumber();
          const ipfs_endorsed = await contractwithsigner.tokenURI(tokenId);
          endorsed_ipfs.push(ipfs_endorsed);
          endorsed.push({"name": endorsed_nfts[i].name, "description": endorsed_nfts[i].description, "image": nftipfsAddress+endorsed_nfts[i].imageuri})
          // await axios.get(nftipfsAddress+ipfs_endorsed).then((metadata) => {
          //   endorsed_ipfs.push(ipfs_endorsed);
          //   endorsed.push(metadata.data);
          // });
        }
        setNFT(true);
        setNftCID(ipfs_cids);
        setNFTData(nft_datas);
        setEndorsingData(endorsed);
        setEndorsedCid(endorsed_ipfs);
        const response = await contractwithsigner.GetSharingAllowed(account);
        const endorsements_allowed = response.toNumber();
        setEndorsementsAllowed(endorsements_allowed);
      }
    } catch (error) {
      console.log(error);
    }
  };
  
  const handleButtonClick = (index) => {
    if(endorsementsAllowed<1){
      alert("You are not allowed to make any endorsements");
    }else{
      setHash(get_nft_cids[index]);
      setSelectedData(nft_data[index]);
    }
  };

  const Verify = async() => {
    const response = await axios.post('http://localhost:8001/scanQR');
    // console.log(response.data["verified"], response.data["uri"]);
    if(response.data["verified"] == true){
      // const getdata = await getVerificationData(response.data["image"]);
      setVerifiedData(response.data);
      setVerified(response.data["verified"]);
      setVerifiedURI(response.data["tokenId"]);
      console.log(response.data);
    } else{
      setVerified(response.data["verified"]);
    }
  };

  const getVerificationData = async(uri) =>{
    return await axios.get(nftipfsAddress+uri)
  }

  return (
    <div className="home-container">
      <Helmet>
        <title>Home</title>
        <meta property="og:title" content="Dashboard" />
        <link href="https://db.onlinewebfonts.com/c/974bd878107a4b17fbb34db4029679e9?family=Clepto+Regular" rel="stylesheet"></link>
      </Helmet>
      <header data-thq="thq-navbar" className="home-navbar">
        <span className="home-logo"><a  href="/">
              ChainCo
            </a></span>
        <div
          data-thq="thq-navbar-nav"
          data-role="Nav"
          className="home-desktop-menu"
        >
          <nav
            data-thq="thq-navbar-nav-links"
            data-role="Nav"
            className="home-nav"
          >
            {isConnected && 
            <div><a href="/multiple" className="home-button2 button-clean button">
              Multiple Transaction
            </a>
            
            <a href="/portfolio" className="home-button2 button-clean button">
              Portfolio
            </a>
            <a href="/reputation" className="home-button2 button-clean button">
              Reputation
            </a>
            <a href="/swap" className="home-button2 button-clean button">
              SwapTokens
            </a>
            <a href="/jobsavailable" className="home-button2 button-clean button">
              Jobs Demand Index
            </a></div>}
          </nav>
        </div>
        <div data-thq="thq-navbar-btn-group" className="home-btn-group">
          
          <button onClick={checkConnectionBeforeConnecting} className="home-button6 button">
            {connectmsg}
          </button>
        </div>
        <div data-thq="thq-burger-menu" className="home-burger-menu">
          <button className="button home-button5">
            <svg viewBox="0 0 1024 1024" className="home-icon">
              <path d="M128 554.667h768c23.552 0 42.667-19.115 42.667-42.667s-19.115-42.667-42.667-42.667h-768c-23.552 0-42.667 19.115-42.667 42.667s19.115 42.667 42.667 42.667zM128 298.667h768c23.552 0 42.667-19.115 42.667-42.667s-19.115-42.667-42.667-42.667h-768c-23.552 0-42.667 19.115-42.667 42.667s19.115 42.667 42.667 42.667zM128 810.667h768c23.552 0 42.667-19.115 42.667-42.667s-19.115-42.667-42.667-42.667h-768c-23.552 0-42.667 19.115-42.667 42.667s19.115 42.667 42.667 42.667z"></path>
            </svg>
          </button>
        </div>
        <div data-thq="thq-mobile-menu" className="home-mobile-menu">
          <div
            data-thq="thq-mobile-menu-nav"
            data-role="Nav"
            className="home-nav1"
          >
            <div className="home-container1">
              <span className="home-logo1">ChainCo</span>
              <div data-thq="thq-close-menu" className="home-menu-close">
                <svg viewBox="0 0 1024 1024" className="home-icon02">
                  <path d="M810 274l-238 238 238 238-60 60-238-238-238 238-60-60 238-238-238-238 60-60 238 238 238-238z"></path>
                </svg>
              </div>
            </div>
            <nav
              data-thq="thq-mobile-menu-nav-links"
              data-role="Nav"
              className="home-nav2"
            >
            <a href="/multiple" className="home-button2 button-clean button">
              Multiple Transaction
            </a>

            </nav>
            <div className="home-container2">
              <button className="home-login button">Login</button>
              <button className="button">Register</button>
            </div>
          </div>
          <div className="home-icon-group">
            <svg viewBox="0 0 950.8571428571428 1024" className="home-icon04">
              <path d="M925.714 233.143c-25.143 36.571-56.571 69.143-92.571 95.429 0.571 8 0.571 16 0.571 24 0 244-185.714 525.143-525.143 525.143-104.571 0-201.714-30.286-283.429-82.857 14.857 1.714 29.143 2.286 44.571 2.286 86.286 0 165.714-29.143 229.143-78.857-81.143-1.714-149.143-54.857-172.571-128 11.429 1.714 22.857 2.857 34.857 2.857 16.571 0 33.143-2.286 48.571-6.286-84.571-17.143-148-91.429-148-181.143v-2.286c24.571 13.714 53.143 22.286 83.429 23.429-49.714-33.143-82.286-89.714-82.286-153.714 0-34.286 9.143-65.714 25.143-93.143 90.857 112 227.429 185.143 380.571 193.143-2.857-13.714-4.571-28-4.571-42.286 0-101.714 82.286-184.571 184.571-184.571 53.143 0 101.143 22.286 134.857 58.286 41.714-8 81.714-23.429 117.143-44.571-13.714 42.857-42.857 78.857-81.143 101.714 37.143-4 73.143-14.286 106.286-28.571z"></path>
            </svg>
            <svg viewBox="0 0 877.7142857142857 1024" className="home-icon06">
              <path d="M585.143 512c0-80.571-65.714-146.286-146.286-146.286s-146.286 65.714-146.286 146.286 65.714 146.286 146.286 146.286 146.286-65.714 146.286-146.286zM664 512c0 124.571-100.571 225.143-225.143 225.143s-225.143-100.571-225.143-225.143 100.571-225.143 225.143-225.143 225.143 100.571 225.143 225.143zM725.714 277.714c0 29.143-23.429 52.571-52.571 52.571s-52.571-23.429-52.571-52.571 23.429-52.571 52.571-52.571 52.571 23.429 52.571 52.571zM438.857 152c-64 0-201.143-5.143-258.857 17.714-20 8-34.857 17.714-50.286 33.143s-25.143 30.286-33.143 50.286c-22.857 57.714-17.714 194.857-17.714 258.857s-5.143 201.143 17.714 258.857c8 20 17.714 34.857 33.143 50.286s30.286 25.143 50.286 33.143c57.714 22.857 194.857 17.714 258.857 17.714s201.143 5.143 258.857-17.714c20-8 34.857-17.714 50.286-33.143s25.143-30.286 33.143-50.286c22.857-57.714 17.714-194.857 17.714-258.857s5.143-201.143-17.714-258.857c-8-20-17.714-34.857-33.143-50.286s-30.286-25.143-50.286-33.143c-57.714-22.857-194.857-17.714-258.857-17.714zM877.714 512c0 60.571 0.571 120.571-2.857 181.143-3.429 70.286-19.429 132.571-70.857 184s-113.714 67.429-184 70.857c-60.571 3.429-120.571 2.857-181.143 2.857s-120.571 0.571-181.143-2.857c-70.286-3.429-132.571-19.429-184-70.857s-67.429-113.714-70.857-184c-3.429-60.571-2.857-120.571-2.857-181.143s-0.571-120.571 2.857-181.143c3.429-70.286 19.429-132.571 70.857-184s113.714-67.429 184-70.857c60.571-3.429 120.571-2.857 181.143-2.857s120.571-0.571 181.143 2.857c70.286 3.429 132.571 19.429 184 70.857s67.429 113.714 70.857 184c3.429 60.571 2.857 120.571 2.857 181.143z"></path>
            </svg>
            <svg viewBox="0 0 602.2582857142856 1024" className="home-icon08">
              <path d="M548 6.857v150.857h-89.714c-70.286 0-83.429 33.714-83.429 82.286v108h167.429l-22.286 169.143h-145.143v433.714h-174.857v-433.714h-145.714v-169.143h145.714v-124.571c0-144.571 88.571-223.429 217.714-223.429 61.714 0 114.857 4.571 130.286 6.857z"></path>
            </svg>
          </div>
        </div>
      </header>
      <button className='home-button6 button' onClick={() => Verify()}>Verify Credentials/Proofs</button>

    {verified!==undefined && <ul className="home-cards">
      {verified==true &&
      <div className="home-card">
          <li className="home-paragraph">The NFT with tokenId: {verifiedURI} is <h3>verified</h3>
          Name: {verifiedData["name"]} <br></br> Description: {verifiedData["description"]} <br></br> TokenId: {verifiedData["tokenId"]}
          <img src={verifiedData["image"]} className="home-image05" ></img>
          </li>
      </div>
      }
      {verified==false &&
      <div className="home-card" style={{width: 700}}>
          <li className="home-paragraph">The NFT with Hash: {verifiedURI} is <h3>NOT Verified</h3>
          </li>
      </div>
      }
      </ul>}
      
      {isConnected && <><label className='mint-btn'>Total ChainCo's Minting Volume: {totalmints}
      </label> <label className='mint-btn'>Total ChainCo's Shared Volume: {total_endorsements}</label><br></br></>}
      {isConnected && admin && <Loginsystem></Loginsystem>}
      <section className="home-hero">
      
      {!isConnected && <div className="home-heading">
          <h1 className="home-header">Store confidential data.<br></br> Transfer on any chain. <br></br>Succeed</h1>
          <p className="home-caption">
          Decentralized Identity Verification and storage system.
          </p>
        </div>}
        <div className="home-buttons">
          {/* <button onClick={checkConnectionBeforeConnecting} className="button">
            {connectmsg}
          </button> */}
          
        </div>
      </section>
      <section className="home-description">
      {isConnected && <div className="home-container">
      <p className="caption">
          Your ChainCo Profile:
      </p>
      <label className='home-button6 button'>Total ChainCo Sharings allowed: {endorsementsAllowed}</label>
        <label className='home-button6 button'>ChainCo SBT's minted to your account
        </label>
        <ul><span className="margin-value">{fetched_nftdata && 
        nft_data.map((nft, index) => (
        <>
          <div className="home-card" style={{width: 700}} key={index}>
          <li className="home-paragraph">{nft.name}: <br></br>{nft.description}
          <img src={nft.image} className="home-image06" ></img>
          </li>
          {ipfs_hash !== get_nft_cids[index] && <button className='home-button6 button' onClick={() => handleButtonClick(index)}>Share</button>}
          {ipfs_hash == get_nft_cids[index] && <Share passedValue={ipfs_hash} data={selectedData}></Share>}
          </div>
          </>
        ))}</span>
        </ul>
    </div>}
    
    {isConnected && <div className="home-container">
      <label className='home-button6 button'>ChainCo SBT's shared to your account
      </label>
        <ul>{fetched_nftdata && 
        endorsed_mints.map((nft, index) => (
        <>
          <div className="home-card" style={{width: 700}} key={index}>
          <li className="home-paragraph">{nft.name}: <br></br>{nft.description}
          <img src={nft.image} className="home-image06" ></img>
          </li>
          <br></br>

          </div>
          </>
        ))}
        </ul>
    </div>}
        <img
          alt="image"
          src="/hero-divider-1500w.png"
          className="home-divider-image"
        />
        
      </section>
      {!isConnected && <section className="home-cards">
        <div className="home-row">
          <div className="home-card">
            
            <div className="home-main">
              <div className="home-content01">
                <h2 className="home-header01">
                  70% of the Certificates are web2 based or paper based
                </h2>
                <p className="home-description02">
                  The project aims to tackle the problem of secure credential
                  verification using SoulBound NFTs in a decentralized manner.
                  By creating a Dapp with features for issuers to mint, manage,
                  and verify NFTs, we intend to revolutionize how certificates
                  and achievements are showcased and verified, enhancing their
                  value and authenticity in the digital world.
                </p>
              </div>
            </div>
          </div>
          <div className="home-card01">
            
            <div className="home-main1">
              <div className="home-content02">
                <h2 className="home-header02">
                  : Decentralized Identity verification and storage system
                </h2>
                <p className="home-description03">
                  Ensuring the authenticity and uniqueness of certificates,
                  achievements, and credentials has become a critical concern.
                  Traditional methods are susceptible to duplication and
                  tampering, diminishing the value of these accolades. To
                  address this issue, we aim to create a Dapp that leverages 
                  modified ERC721 tokens inspired by SoulBound Tokens.
                </p>
              </div>
              
            </div>
          </div>
        </div>
               
        
      </section>}

      <Footer></Footer>
      <div>
        <Script>
          
        </Script>
      </div>
    </div>
  );
};

export default Home;

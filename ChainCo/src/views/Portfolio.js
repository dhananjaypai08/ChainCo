import React from "react";

import Script from "dangerous-html/react";
import { Helmet } from "react-helmet";
import { useState, useEffect } from "react";
import axios from "axios";
import { Redirect } from 'react-router-dom';
import abi from "../contracts/Autocrate.json";
//import './App.css';
import { ethers } from "ethers";

import "./home.css";
import Footer from "./Footer";
// import { useAppContext } from "../AppContext";
// import { CovalentClient } from "@covalenthq/client-sdk";

const Portfolio = () => {
  const [address, setAddress] = useState();
  const [contract, setNewContract] = useState();
  // const [totalmints, setMints] = useState(0);
  const [signer, setSigner] = useState();
  const [address_mints, setAddressMints] = useState("Please Enter an address first");
  const [nft_data, setNFTData] = useState([]);
  const [fetched_nftdata, setNFT] = useState(false);
  const [loader, setLoader] = useState(false);
  const [endorsed_mints, setEndorsingData] = useState([]);
  const [get_endorsed_cids, setEndorsedCid] = useState([]);
  const [total_endorsed_mints, setEndorsedMints] = useState("Please Enter an address first");
  const [selectedData, setSelectedData] = useState();
  const [qrcode, setQRcode] = useState("");
  const [qrcodegenerated, setQRcodeStatus] = useState(false);
  const [selectedIndex, setIndex] = useState("");
  const [casualInsights, setCasualInsights] = useState();
  const [CIflag, setCIflag] = useState(false);

  const nftipfsAddress = "https://ipfs.infura.io/ipfs/";

  useEffect(() => {
    const connectWallet = async () => {
      const contractAddress = "0x8264a7B7d02ab5eF1e57d0ad10110686D79d8d46"//"0x816df2a69bB2D246B1ee5a4F2d1B3EbcB3aF7C85";//"0x61eFE56495356973B350508f793A50B7529FF978";
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
          setAddress(account);
          const provider = new ethers.providers.Web3Provider(window.ethereum);

          const signer = provider.getSigner();

          const contract = new ethers.Contract(
            contractAddress,
            contractAbi,
            signer
          );
          const authenticated = false;
          setNewContract(contract);
          setSigner(signer);
          // setState({ provider, signer, contract, account, authenticated });
          // setConnection(true);
          // setMsg(account);
        }
      } catch (error) {
        console.log(error);
      }
  };
  connectWallet();
  }, []);

  const getNFT = async(event) => {
    event.preventDefault();
    setQRcodeStatus(false);
    console.log(contract, signer);
    if(contract != undefined && signer!=undefined){
        const address = document.querySelector('#walletaddress').value;
        const contractwithsigner = contract.connect(signer);
        const resp = await contractwithsigner.total_sbt_received_from_org(address);
        setAddressMints(resp.toNumber());
        const endorsedmints = await contractwithsigner.getSharingReceived(address);
        setEndorsedMints(endorsedmints.toNumber())
        // const client = new CovalentClient("cqt_rQt3xrBGR96Gg3bp7qk7vGJDQ8rV");
        // const response = await client.BalanceService.getTokenBalancesForWalletAddress("eth-sepolia",address, {"nft": true});
        // console.log(response.data["items"], response.data["items"].length);
        setLoader(true);
        const nfts = await contractwithsigner.getTokenIdAccount(address);
        let nft_datas = []
        for(var i=0;i<nfts.length;i++){
          // const tokenId = nfts[i].toNumber();
          // const ipfs_cid = await contractwithsigner.tokenURI(tokenId);
          // console.log(ipfs_cid);
          // try{
          //   await axios.get(nftipfsAddress+ipfs_cid).then((metadata) => {
          //     nft_datas.push(metadata.data);
          //   });
          // } catch(e){
          //   console.log('something went wrong');
          // }
          nft_datas.push({"name": nfts[i].name, "description": nfts[i].description, "image": nftipfsAddress+nfts[i].imageuri, "tokenId": nfts[i].tokenId.toNumber(), "walletAddress": address});
          
        }
        const endorsed_nfts = await contractwithsigner.getTokenIdAccountSharing(address);
        let endorsed = [];
        let endorsed_ipfs = [];
        for(var i=0;i<endorsed_nfts.length;i++){
          const tokenId = endorsed_nfts[i].tokenId.toNumber();
          const ipfs_endorsed = await contractwithsigner.tokenURI(tokenId);
          endorsed.push({"name": endorsed_nfts[i].name, "description": endorsed_nfts[i].description, "image": nftipfsAddress+nfts[i].imageuri, "tokenId": nfts[i].tokenId.toNumber()});
          // console.log(ipfs_endorsed);
          // await axios.get(nftipfsAddress+ipfs_endorsed).then((metadata) => {
          //   endorsed_ipfs.push(ipfs_endorsed);
          //   endorsed.push(metadata.data);
          // });
        }
        console.log(nft_datas);
        setEndorsingData(endorsed);
        setEndorsedCid(endorsed_ipfs);
        setNFT(true);
        setNFTData(nft_datas);
        setLoader(false);
        const casualInsightsdata = await axios.post("http://localhost:8001/getCasualInsights", nft_datas
        );
        setCasualInsights(casualInsightsdata.data);
        setCIflag(true);
    } else{alert("Please connect to your metamask wallet");}
    event.target.reset();
  }
    
  const handleButtonClick = async(index) => {
    try {
      const response = await axios.post('http://localhost:8082/generate_qrcode', nft_data[index], {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if(response.status == 200){
        console.log(response.data, response);
        setQRcode(response.data);
        setQRcodeStatus(true);
        setSelectedData(nft_data[index]);
        setIndex(index);
      }
      else{
        console.log('something went wrong')
      }
    } catch (error) {
      console.error('Error during POST request:', error.message);
    }
  };
  
  return (
    <div className="home-container">
      <Helmet>
        <title>Portfolio</title>
        <meta property="og:title" content="Dashboard" />
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
          > <a href="/" className="home-button2 button-clean button">
          Home
        </a>
            <a href="/multiple" className="home-button2 button-clean button">
              Multiple Transaction
            </a>
            
            <a href="/reputation" className="home-button2 button-clean button">
              Reputation
            </a>
          </nav>
        </div>
        <div data-thq="thq-navbar-btn-group" className="home-btn-group">
          <div className="home-socials">
          </div>
          
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
      <div className="home-hero">
      <label className='home-button6 button'>Total ChainCo NFT's Minted to your account: {address_mints}<br></br>
      Total ChainCo NFT's Shared to your wallet: {total_endorsed_mints}
      </label>
      </div>
      <label className='home-button6 button'>Total NFT's Received from ChainCo ORG: {address_mints}
      </label>
      
    <div class="home-container">
      {qrcodegenerated && 
      <div className="home-card" style={{width: 700}}>
      <li className="home-paragraph">QRcode generated as verifiable proof
      <img src={qrcode} className="home-image06" ></img>
      </li>
      </div>
      }
    </div>
    <form onSubmit={getNFT}>
      <div className="home-container" style={{width: 300}}>
        <label className='home-links' style={{color: "white"}}>Enter Wallet Address</label>
         <input type="text" id="walletaddress" style={{width: 300}} className="home-button6 button" required></input>
        
         <button type="submit" className='home-button6 button'>Get NFT</button>
      </div>
      {loader && <div><label className='home-links' style={{color: "white"}}>Fetching SBT...</label><div className="loader"></div></div>}
    </form>
    
      <section className="home-hero">

    <div className="home-container">
    {CIflag &&
    <ul className="flex-container">
          <div className="home-card SBT" style={{width: 700}}>
          <li className="home-paragraph">{casualInsights}
          </li>
          <br></br>
          </div>
        </ul>}
    <label className='home-button6 button'>ChainCo SBT's minted to your account
    </label>
        <ul className="flex-container">{fetched_nftdata && 
        nft_data.map((nft, index) => (
        <>
          <div className="home-card SBT" style={{width: 700}}>
          <li className="home-paragraph">{nft.name}: <br></br>{nft.description}
          <img src={nft.image} className="home-image06" ></img>
          </li>
          <br></br>
          {<button className='home-button6 button' onClick={() => handleButtonClick(index)}>Generate Proof</button>}
          </div>
        </>
        ))}
        </ul>
      
    </div>

    <div className="home-container">
    <label className='home-button6 button'>ChainCo SBT's shared to your account
      </label>
        <ul className="flex-container">{fetched_nftdata && 
        endorsed_mints.map((nft,index) => (
        <>
          <div className="home-card SBT" style={{width: 700}}>
          <li className="home-paragraph">{nft.name}: <br></br>{nft.description}
          <img src={nft.image} className="home-image06" ></img>
          </li>
          <br></br>
          {<button className='home-button6 button' onClick={() => handleButtonClick(index)}>Generate Proof</button>}
          </div>
        </>
        ))}
        </ul>
    </div>

      </section>
      <section className="home-description">
        <img
          alt="image"
          src="/hero-divider-1500w.png"
          className="home-divider-image"
        />
        
      </section>
      
      <Footer></Footer>
      <div>
        <Script>
          
        </Script>
      </div>
    </div>
  );
};

export default Portfolio;

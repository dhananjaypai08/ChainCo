import React from 'react'

import { useState, useEffect} from 'react';
import { ethers } from "ethers";
import './home.css'
// import { useLocation } from 'react-router-dom'
import Script from "dangerous-html/react";
import { Helmet } from "react-helmet";
import { useAppContext } from '../AppContext';

// import { create as ipfsHttpClient } from "ipfs-http-client";
import { create } from "ipfs-http-client";
import Papa from 'papaparse';
import abi from "../contracts/Autocrate.json";
import lighthouse from '@lighthouse-web3/sdk';
import Footer from './Footer';
import axios from 'axios';

const projectId = '2WCbZ8YpmuPxUtM6PzbFOfY5k4B';
const projectSecretKey = 'c8b676d8bfe769b19d88d8c77a9bd1e2';
const authorization = "Basic " + btoa(process.env.REACT_APP_INFURA_ID+":"+process.env.REACT_APP_INFURA_SECRET);
const apiKey = process.env.REACT_APP_LIGHTHOUSE_API_KEY;

const Multiple = () => {
    const { state, setState } = useAppContext() 
    const { provider, signer, contract, account, authenticated } = state;
    const [authorized, setAuth] = useState(0);
    const [file, setFile] = useState();
    const [send, setSend] = useState(0);
    const [loader, setLoader] = useState(false);
    const [addressArray, setAddressArray] = useState([]);
    const [nameArray, setNameArray] = useState([]);
    const [descriptionArray, setDescriptionArray] = useState([]);
    const [isConnected, setConnection] = useState(false);
    const [connectmsg, setMsg] = useState("Connect Wallet");
    
    const handlePhotoSelect = (event) => {
        setFile(event.target.files[0]);
    };

    const checkConnectionBeforeConnecting = () => {
      if(!isConnected){
        connectWallet();
      }
    }

    const handleCsvSelect = (event) => {
      const csvfile = event.target.files[0];
      if (csvfile) {
        Papa.parse(csvfile, {
            header: true,
            dynamicTyping: true,
            complete: (result) => {
                const { data } = result;
                const addresses = data.map((row) => row.address);
                const names = data.map((row) => row.name);
                const descriptions = data.map((row) => row.description);
                let i = 0;
                while(i<names.length){
                  if(names[i] == undefined){
                    names.splice(i, 1);
                    descriptions.splice(i, 1);
                    addresses.splice(i, 1);
                  } else{ i++; }
                }
                setAddressArray(addresses);
                setNameArray(names);
                setDescriptionArray(descriptions);
                console.log(addresses, names, descriptions);
            },
            error: (error) => {
                console.error('CSV parsing error:', error.message);
            },
        });
      }
    }

    const ipfs_client = create({
      host: "ipfs.infura.io",
      port: 5001,
      protocol: "https",
      apiPath: "/api/v0",
      headers:{
        authorization: authorization
      },
    });

    const call = async() => {
        const contractwithsigner = contract.connect(signer)
        const resp = await contractwithsigner.getVal(account)
        console.log(resp)
    } 
    const connectWallet = async () => {
      const contractAddress = "0x70B066d68D78cF29f49f67eC2ecEa77877b26e25"//"0x70B066d68D78cF29f49f67eC2ecEa77877b26e25"//"0x8264a7B7d02ab5eF1e57d0ad10110686D79d8d46"//"0x681a204B065604B2b2611D0916Dca94b992f0B41"//"0x816df2a69bB2D246B1ee5a4F2d1B3EbcB3aF7C85";//"0x61eFE56495356973B350508f793A50B7529FF978"
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
  
          const signer = provider.getSigner();
  
          const contract = new ethers.Contract(
            contractAddress,
            contractAbi,
            signer
          );
          const authenticated = false;
          console.log(account)
          setState({ provider, signer, contract, account, authenticated });
          setConnection(true);
          setMsg(account);
        }
      } catch (error) {
        console.log(error);
      }
    };

    const SignIn = async(event) => {
      event.preventDefault();
      const {contract} = state;
      const {signer} = state;
      const walletAddress = document.querySelector('#walletaddress').value;
      const password = document.querySelector('#password').value;
      console.log(contract, password, walletAddress);
      const contractwithsigner = contract.connect(signer);
      const resp = await contractwithsigner.getVal(walletAddress);
      if(resp == password){
          setAuth(1)
          const authenticated = true;
          setState({ provider, signer, contract, account, authenticated});
          //sessionStorage.setItem(account[0], JSON.stringify(state));    
          console.log('logged In');
          console.log(account, authenticated);
      }
      else{setAuth(2)}
      event.target.reset()
  };

    const SendSBT = async(event) => {
        event.preventDefault();
        let tokenuris = [];
        // let domains = [];
        const image = file;
        console.log('uploading...');
        // const result = await ipfs.add(image);
        // const result = await lighthouse.uploadBuffer(image, apiKey);
        // const image_uri = "https://gateway.lighthouse.storage/ipfs/"+result.data.Hash;
        const result = await ipfs_client.add(image);
        const image_uri = "https://ipfs.infura.io/ipfs/"+result.cid.toString();
        console.log('file uploaded');
        for(let i=0; i<nameArray.length; i++){
          const updatedJSON = `{
            "name": "${nameArray[i]}",
            "description": "${descriptionArray[i]}",
            "image": "${image_uri}"
          }`
          console.log(updatedJSON);
          // const ans = await ipfs.add(updatedJSON);
          // const ans = await lighthouse.uploadText(updatedJSON, apiKey);
          const ans = await ipfs_client.add(updatedJSON);
          tokenuris.push(ans.cid.toString());
          console.log('uploaded data', ans.cid.toString());
          // domains.push("test");
        }
        console.log(addressArray, tokenuris);
        const contractwithsigner = contract.connect(signer);
        console.log('connected with contract');
        const resp = await contractwithsigner.mintBatch(addressArray, nameArray, descriptionArray, result.cid.toString(), tokenuris);
        console.log(resp);
        setLoader(true);
        event.target.reset();
        const receipt = await resp.wait();
        if(receipt.status == 1){
          setSend(1);
          setLoader(false);
          alert("All Your Sould Bound Tokens have been minted");
        } else{
          alert("Your Soul Bound Token has not been minted. Please try again")
        }
    }
    if (authenticated){
        
        call()
    }
    return (<div>

    <div>
        <div className="home-container">
          <Helmet>
            <title>ChainCo</title>
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
              >
                <a  href="/" className="home-button1 button-clean button">
              Home
            </a>
            <a href="/multiple" className="home-button2 button-clean button">
              Multiple Transaction
            </a>
            <a href="/portfolio" className="home-button2 button-clean button">
                    Portfolio
                  </a>
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
                  
                  <a  href="/" className="home-button1 button-clean button">
                    Home
                  </a>
                  <a href="/multiple" className="home-button2 button-clean button">
                    Multiple Transaction
                  </a>
                  <a href="/portfolio" className="home-button2 button-clean button">
                    Portfolio
                  </a>
                  <a href="/reputation" className="home-button2 button-clean button">
                    Reputation
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
          {isConnected && <div>
    {authorized == 1 && 
    // <div data-thq="thq-close-menu" className="home-caption01">Wohooo!! You are Logged In
    // </div> && 
    <div data-thq="thq-close-menu" className="home-caption01">LoggedIn successully
    </div>
    }

    {authorized == 2 && 
    <div data-thq="thq-close-menu" className="home-caption01">Wrong credentials
    </div>
    }
  {authorized !== 1 &&
    

    <form onSubmit={SignIn}>
      
      <div className='EmptySpace'><label className='title-head' style={{color: "white"}}>Wallet Address   </label>
      <input type="url" id="walletaddress" value={account ? account: ""} disabled style={{width: 300}} className="home-button6 button"></input>
      <br></br><br></br>
      
        <label className='title-head' style={{color: "white"}}>Enter Password</label>
      <input type="password" id="password" placeholder="Enter Your Password" style={{width: 300}} className='home-button6 button'></input>
      </div>
      <button type="submit" className='home-button6 button'>Login</button>
   </form>
  }
    
    </div>}
          {send == 1 && 
          <div data-thq="thq-close-menu" className="home-caption01">SBT has been SENT!
          </div>
          }
          {authorized == 1 &&
            <form onSubmit={SendSBT}>
              <label className='home-links' style={{color: "white"}}>Upload CSV file</label>
              <input type="file" id="file" className='home-button6 button' onChange={handleCsvSelect}></input>
              <br></br><br></br>
              <label className='home-links' style={{color: "white"}}>Upload Image</label>
              <input type="file" id="image" className='home-button6 button' onChange={handlePhotoSelect}></input>
              <br></br><br></br>
              {/* <label className='home-links' style={{color: "white"}}>Upload CSV</label>
              <input type="file" id="image" className='home-button7 button' onChange={handleCsv}></input> */}
              
              <button type="submit" className='home-button6 button'>Send SBT</button>
              {loader &&  <div><label className='home-links' style={{color: "white"}}>Minting SBT's in progress...</label><div className="loader"></div></div>}
             
            </form>
          }
          
          <section className="home-description">
            <div className='EmptySpace'></div>
            {!isConnected && <h1 className="home-header">Please connect Wallet.</h1>}
            <img
              alt="image"
              src="/hero-divider-1500w.png"
              className="home-divider-image"
            />
            
          </section>
    
          <Footer></Footer>
        </div>
      ;</div>
      
    </div>
    )
}
export default Multiple;
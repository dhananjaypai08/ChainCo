import React, { useState, useEffect } from 'react';
import { ethers, bigNumberify } from "ethers";
import axios from 'axios';
import './Swap.css';
import './home.css';
import Footer from './Footer';
import { useAppContext } from "../AppContext";
import abi from "../contracts/Autocrate.json";

const Swap = () => {
  const [fromToken, setFromToken] = useState('ETH');
  const [channelId, setChannelId] = useState('');
  const [depositAddress, setDepositAddress] = useState('');
  const [fromChain, setFromChain] = useState('Ethereum');
  const [amount, setAmount] = useState(0);
  const [estimatedOutputmsg, setEstimatedOutputmsg] = useState('Estimate Output & Bridge');
  const [estimatedVal, setEstimatedVal] = useState();
  const [estimated, setEstimation] = useState(false);

  const { state, setState } = useAppContext()
  const { provider, signer, contract, account, authenticated } = state;
  const [network, setNetwork] = useState();
  const [accountAddress, setMsg] = useState("Connect Wallet");
  const [isConnected, setConnection] = useState(false);
  const [loader, setLoader] = useState(false);
  const [transactionConfirmed, setTransactionConfirmed] = useState(false);

  const [stockpriceinfiat, setStockPriceinFiat] = useState();
  const [cryptopriceinfiat, setCryptoVal] = useState();

  const checkConnectionBeforeConnecting = () => {
    if(!isConnected){
      connectWallet();
    }
  }
  const desiredChainId = 11155111;
  const connectWallet = async () => {
    const contractAddress = "0x0aE8D798A5E7Ecc88dF127743F570285eC80c746"//"0x8264a7B7d02ab5eF1e57d0ad10110686D79d8d46"//"0x681a204B065604B2b2611D0916Dca94b992f0B41"//"0x816df2a69bB2D246B1ee5a4F2d1B3EbcB3aF7C85";//"0x61eFE56495356973B350508f793A50B7529FF978"
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
        setNetwork(network);
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
        const signer = provider.getSigner();
        setMsg(account);
        // const contract = new ethers.Contract(
        //   contractAddress,
        //   contractAbi,
        //   signer
        // );
        console.log(account)
        setState({ provider, signer, contract, account, authenticated });
        setConnection(true);
        // const contractwithsigner = contract.connect(signer);
        // const pass = await contractwithsigner.creds(account);
        // if(pass !== undefined && pass !== ""){
        //   setAdmin(true);
        // }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getStockVal = async(symbol) => {
    const options = {
      method: 'GET',
      url: 'https://real-time-finance-data.p.rapidapi.com/stock-time-series-source-2',
      params: {
        symbol: `${symbol}`,
        period: '1D'
      },
      headers: {
        'x-rapidapi-key': 'd083f523a8msha5b1f215732c0cbp1216b9jsn719049c6090a',
        'x-rapidapi-host': 'real-time-finance-data.p.rapidapi.com'
      }
    };
    try {
      const response = await axios.request(options);
      console.log(response.data);
      setStockPriceinFiat(response.data.price);
    } catch (error) {
      console.error(error);
    }

  }

  const getCryptoVal = async() => {
    const stock = 'ETH';
    const Cryptoptions = {
      method: 'GET',
      url: `https://crypto-market-prices.p.rapidapi.com/tokens/${stock}`,
      params: {base: 'USDT'},
      headers: {
        'x-rapidapi-key': 'd083f523a8msha5b1f215732c0cbp1216b9jsn719049c6090a',
        'x-rapidapi-host': 'crypto-market-prices.p.rapidapi.com'
      }
    };
    try {
      const response = await axios.request(Cryptoptions);
      console.log(response.data);
      setCryptoVal(response.data.price)
    } catch (error) {
      console.error(error);
    }
  }


  const changeChain = async(givenChain) => {
    if(network.chainId != givenChainId){
      try {
        const desiredChainId = Chains[givenChainId];
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
  }

  useEffect(() => {
    // Simulate fetching estimated output on change of tokens or amount (optional)
    if (fromToken || fromChain || amount > 0) {
      // Simulate fetching estimated output from an API or blockchain call
      setEstimatedOutputmsg("Estimate Output")
      setEstimatedVal();
      setEstimation(false)
    } 
  }, [fromToken, amount, fromChain]);
  const calculateAmt = async() => {
    if(!estimated){
        setLoader(true);
        const response = await axios.post('http://localhost:3001/swap', 
        {
          srcAsset: fromToken,
          srcChain: fromChain,
          destAddress: accountAddress,
          amount: parseInt(amount),
        },
        );
        setChannelId(response.data["channelId"]);
        setDepositAddress(response.data["DepositAddress"])
        let AmtOutput = response.data["AmountOutput"];
        AmtOutput = parseInt(AmtOutput)/(1e18);
        setEstimatedOutputmsg(`Estimated Output is : ${AmtOutput} ETH`);
        setEstimation(true); 
        setLoader(false);
        setEstimatedVal(AmtOutput);
        // const gasPrice = await provider.getGasPrice();
        // const nonce = await provider.getTransactionCount(accountAddress, "latest");
        // const value = ethers.utils.parseEther(AmtOutput.toString());
        // //console.log(gasPrice, accountAddress, value, nonce, ethers.utils.hexlify(gasPrice))
        // const tx = {
        //   from: accountAddress,
        //   to: response.data["DepositAddress"],
        //   value: value,
        //   nonce: nonce,
        //   gasLimit: ethers.utils.hexlify(gasPrice), // 100000
        //   gasPrice: gasPrice,
        // }
        // try{
        //   signer.sendTransaction(tx).then((transaction) => {
        //     console.log(transaction);
        //     alert("Send finished!");
        //   })
        // } catch{
        //   alert('Something went wrong');
        // }
        

    }
  };

  const DepositToken = async() => {
    let amt;
    if(fromToken == 'USDC'){
        amt = (amount*1e6);
    } else{
        amt = (amount*1e18);
    }
    const txParams = {
        from: accountAddress, // Get user's current address
        to: depositAddress,
        value: amt, // Convert amount to Wei (smallest unit of ETH)
        gasLimit: 8117, // Let MetaMask estimate gas
      };
  
    const tx = await signer.sendTransaction(txParams);
    let receipt;
    while (!receipt) {
        try {
        receipt = await provider.getTransactionReceipt(tx.hash);
        } catch (error) {
        console.error('Error fetching receipt:', error);
        }
    }
    setTransactionConfirmed(true);
    window.alert("Transaction has been confirmed!")
    console.log(`Transaction confirmed! txHash: ${txHash}`);
  }

  return (
    <> <br></br>
    <div className="swap-container">
    <button onClick={checkConnectionBeforeConnecting} className="home-button6 button">
            {accountAddress}
    </button><br></br>
      <h2>Swap Tokens</h2>

      <div className="swap-inputs">

      <span>Select Chain</span>
        <select value={fromChain} onChange={(e) => setFromChain(e.target.value)}>
          <option value="Ethereum">Ethereum</option>
          <option value="Bitcoin">Bitcoin</option>
          <option value="Polkadot">Polkadot</option>
          <option value="Chainflip">ChainFlip</option>
          <option value="Arbitrum">Arbitrum</option>

          {/* Add more token options */}
        </select>

        <span>Select Token</span>
        <select value={fromToken} onChange={(e) => setFromToken(e.target.value)}>
          <option value="ETH">ETH</option>
          <option value="BTC">BTC</option>
          <option value="DOT">DOT</option>
          <option value="USDC">USDC</option>
          <option value="FLIP">FLIP</option>

          {/* Add more token options */}
        </select>

        &nbsp;

        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter Amount"
        />
        
      </div>
      
      {isConnected && <><button className="home-button6 button" onClick={calculateAmt}>
        {estimatedOutputmsg}
      </button> <br></br>
      <span className='home-links1'>
            Deposit Address: {depositAddress} </span> <br></br>
        <span className='home-links1'>Channel Id: {channelId}</span></>}

      {/* {estimated &&
      <button onClick={DepositToken} disabled={!fromToken || amount <= 0} className='home-button6 button'>
        Swap
      </button>} */}
      {loader &&  <div><label className='home-links' style={{color: "white"}}>Estimating amount...</label><div className="loader"></div></div>}
    </div>
    <Footer></Footer>
    </>
  );
};

export default Swap;
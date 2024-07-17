import React from 'react'

import Script from 'dangerous-html/react'
import { Helmet } from 'react-helmet'
import { useState, useEffect} from 'react'
import { Redirect } from 'react-router-dom'
import { useAppContext } from '../AppContext'
import './home.css'

const Loginsystem = () => {
    
    const { state, setState } = useAppContext()
    const { provider, signer, contract, account, authenticated } = state;
    console.log(account)
    const [authorized, setAuth] = useState(0);
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
    return (<div>
    {authorized == 1 && 
    // <div data-thq="thq-close-menu" className="home-caption01">Wohooo!! You are Logged In
    // </div> && 
    <Redirect to="/autocrate" />
    }

    {authorized == 2 && 
    <div data-thq="thq-close-menu" className="home-caption01">Wrong credentials
    </div>
    }
    <form onSubmit={SignIn} className='login-container'>
        <label className='home-logo'>Welcome Admin</label> 
         <label className='home-links'style={{color: "white"}}>Wallet Address</label>
         <input type="url" id="walletaddress" value={account ? account: ""} disabled className="home-button6 button"></input>
         <label className='home-links' style={{color: "white"}}>Enter Password</label>
         <input type="password" id="password" placeholder="Enter Your Password" className='home-button6 button'></input>

         <button type="submit" className='home-button6 button'>Login</button>
        
     </form>
    </div>
    )
}
export default Loginsystem;
import React from 'react'

import Script from 'dangerous-html/react'
import { Helmet } from 'react-helmet'
import { useState, useEffect} from 'react'
import { Redirect } from 'react-router-dom'
import { useAppContext } from '../AppContext'
import './home.css'

const Share = (props) => {
    
    const { state, setState } = useAppContext()
    // const { provider, signer, contract, account, authenticated } = state;
    const [endorsed, setEndorsement] = useState(false);
    const [loader, setLoader] = useState(false);
    const endorseNFT = async(event) => {
        event.preventDefault();
        const {contract} = state;
        const {signer} = state;
        const {account} = state;
        const walletAddress = document.querySelector('#endorseaddress').value;
        const contractwithsigner = contract.connect(signer);
        const imageuri = props.data.image.split('/').pop();
        console.log(walletAddress, props.data.name, props.data.description, imageuri, props.passedValue);
        try{
            const resp = await contractwithsigner.shareMint(walletAddress, props.data.name, props.data.description, imageuri, props.passedValue);
            event.target.reset()
            setLoader(true);
            const receipt = await resp.wait();
            if(receipt.status == 1){
                setLoader(false);
                setEndorsement(true);
                alert("Your Sould Bound Token has been shared");
            } else{
                setEndorsement(false);
                alert("Your Soul Bound Token has not been minted. Please try again");
        }
        } catch(e){
            alert(`Something went wrong with error message ${e}`);
        }
        
        
        
    };

    return (<div>
    {endorsed && 
    <div data-thq="thq-close-menu" className="home-caption01">SBT has been shared
    </div>  
    }

    <form onSubmit={endorseNFT}>
         <label className='home-links' style={{color: "white"}}>Wallet Address</label>
         <input type="text" id="endorseaddress" style={{width: 300}} className="button"></input>
         <br></br><br></br>
         <button type="submit" className='home-button6 button'>Share</button>
        
     </form>
     {loader && <div><label className='home-links' style={{color: "white"}}>Sharing SBT...</label><div className="loader"></div></div>}
    </div>
    )
}
export default Share;
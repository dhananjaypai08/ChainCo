const {SwapSDK} = require("@chainflip/sdk/swap");
const express = require("express");

const sdk = new SwapSDK({ network: "perseverance"});

var app = express();
const cors = require('cors');

const allowedOrigins = ['http://localhost:3000']; // Replace with your frontend origin if different

const corsOptions = {
  origin: function(origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies for authenticated requests (optional)
};

app.use(cors(corsOptions));


app.use(express.json());


app.get('/', async function(req, res){
    let ans = await sdk.getAssets();
    // console.log(ans);
    res.json(ans);

});


app.post('/swap', async function(req, res){
    const srcAsset = req.body.srcAsset;
    const srcChain = req.body.srcChain;
    const destAddress = req.body.destAddress;
    let amount = req.body.amount;
    if(srcAsset == "ETH" || srcAsset == "BTC" || srcAsset == "DOT") {
        amount = (1e18*amount).toString();
    }else{
        amount = (1e6*amount).toString();
    }
    let val, status;
    //console.log(srcAsset, srcChain, destAddress, amount);
    val = await Getquote(srcAsset, srcChain, amount, destAddress);
    console.log(val);
    //console.log(typeof(val), val)
    res.json({
        'DepositAddress':`${val['depositAddress']}`, 
        'channelId':`${val['channelId']}`,
        'AmountOutput': `${val['egressAmount']}`
    });
});


app.listen(3001);


const Getquote =async(srcAsset, srcChain, amount, destAddress) =>{
    const quoteArgs = {
        srcAsset: srcAsset,
        srcChain: srcChain,
        destAsset: 'ETH',
        destChain: 'Ethereum',
        amount: amount, // 100 USDC == 100e6
    };
    const val = await sdk.getQuote(quoteArgs);
    
    const channel = await getChannel(quoteArgs, destAddress);
    const ans = {"egressAmount": val["quote"]["egressAmount"],
            "depositAddress": channel["depositAddress"],
            "channelId": channel["depositChannelId"]
    };
    return ans;
} 

const getChannel = async(quoteArgs, destAddress) => {
    const channel = await sdk.requestDepositAddress({
        ...quoteArgs,
        destAddress: destAddress
    });
    console.log(channel);
    const channelId = channel.depositChannelId
    const status = await sdk.getStatus({id: channelId});
    console.log(status);
    return channel
}


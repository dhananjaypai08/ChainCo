const { createInstance } = require("fhevmjs");
const { JsonRpcProvider, AbiCoder } = require("ethers");

const provider = new JsonRpcProvider(`https://testnet.inco.org`);

// Contract address of TFHE.sol
const FHE_LIB_ADDRESS = "0x000000000000000000000000000000000000005d";

let _instance;

const getInstance = async () => {
  if (_instance) return _instance;

  const network = await provider.getNetwork();
  const chainId = +network.chainId.toString(); // chainId: 9090

  console.log("network", network);
  console.log("chainId", chainId);
  
  // Get blockchain public key
  const ret = await provider.call({
    to: FHE_LIB_ADDRESS,
    // first four bytes of keccak256('fhePubKey(bytes1)') + 1 byte for library
    data: "0xd9d47bb001",
  });
  const decoded = AbiCoder.defaultAbiCoder().decode(["bytes"], ret);
  // const string = longObject.toString(); // "[object Object]"
  const string = decoded.toArray();
  
  const publicKey = string[0];
  console.log(publicKey, typeof(publicKey));
  _instance = await createInstance({ chainId, publicKey });
};
getInstance();
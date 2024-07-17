class Node:
    def __init__(self):
        self.url = 'https://eth-sepolia.g.alchemy.com/v2/YrcRBtPyzQZxWtNt-Cd8sYXh46GSSczW'
        self.name = 'Eth-Sepolia Alchemy'
        self.api_key = 'YrcRBtPyzQZxWtNt-Cd8sYXh46GSSczW'
        
class Contract:
    def __init__(self):
        self.name = "DeCAT"
        self.inherits = "ERC721"
        self.address = "0x8264a7B7d02ab5eF1e57d0ad10110686D79d8d46"
        self.abi_path = "../src/contracts/Autocrate.json"
    
class Google:
    def __init__(self):
        self.api_key = 'AIzaSyC4fbSM6bAAqN2p-Bz5Y_JobZ2z5thg2Ak'#'AIzaSyB1exxpSae8kVFmR5M-NtVNrQeHrypaPqo'#'AIzaSyB9XmOWaeNpGjxrg9Sy1VxX2OEx-Icen6s'
        
class Test:
    def __init__(self):
        self.name = "DeCAT"
        self.inherits = "ERC721"
        self.address = "0x61eFE56495356973B350508f793A50B7529FF978"
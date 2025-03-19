import { ethers } from "ethers";
import { useState } from "react";

interface WalletConnectProps {
  currentAddress: string;
  isConnected: boolean;
  onConnected: (address: string) => void;
  onDisconnected: () => void;
}

function WalletConnect({ currentAddress, isConnected, onConnected, onDisconnected }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectError, setConnectError] = useState<Error | null>(null);

  const connectWallet = async () => {
    try {

      setIsConnecting(true);
      setConnectError(null);

      if (!window.ethereum) {
        throw new Error("No Ethereum wallet detected. Please install MetaMask or another wallet.");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);

      const accounts: string[] = await provider.send("eth_requestAccounts", []);

      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();

      if (accounts.length === 0 || accounts[0].toLowerCase() !== signerAddress.toLowerCase()) {
        throw new Error("No accounts available or mismatch with signer");
      }

      try {

      } catch (switchError: any) {
        if (switchError.code === 4902) {

          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0xaa36a7",
                chainName: "Sepolia Testnet",
                nativeCurrency: {
                  name: "Sepolia ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["https://rpc.sepolia.org"],
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              }
            ]
          });
        } else {
          throw switchError
        }
      }

      onConnected(accounts[0]);
    } catch (error: any) {
      console.error("Connection error:", error);
      setConnectError(error);
    } finally {
      setIsConnecting(false);
    }
  }

  const disconnectWallet = () => {
    onDisconnected();
  };

  return (
    <div className="mb-3">
      {isConnected ? (
        <div className="flex justify-between items-center">
          <div className="frost-wallet-display">
            <span className="frost-wallet-address">
              {currentAddress?.slice(0, 6)}...{currentAddress?.slice(-4)}
            </span>
          </div>
          <button 
            onClick={disconnectWallet}
            className="bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-xs"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-blue-600 mb-2 text-sm">
            Connect your wallet to manage your FROST tokens
          </p>
          <button 
            onClick={connectWallet} 
            disabled={isConnecting}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md shadow-md hover:from-blue-600 hover:to-blue-700"
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
          {connectError && <p className="text-red-500 mt-1 text-xs">{connectError.message}</p>}
        </div>
      )}
    </div>
  );

}
export default WalletConnect;
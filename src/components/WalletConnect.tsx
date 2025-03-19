import { ethers } from "ethers";
import { useState } from "react";
import { colors } from "../styles/colors";

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
    <div className="flex flex-col items-center">
      {isConnected ? (
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '9999px',
                backgroundColor: colors.frostFrosty,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: colors.frostPrimary, fontWeight: 500 }}>
                W
              </span>
            </div>
            <div>
              <span style={{ color: colors.frostText }}>Connected:</span>
              <span
                style={{
                  display: 'block',
                  color: colors.frostPrimary,
                  fontFamily: 'monospace',
                }}
              >
                {currentAddress?.slice(0, 6)}...{currentAddress?.slice(-4)}
              </span>
            </div>
          </div>
          <button
            onClick={disconnectWallet}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              fontWeight: 500,
              background: `linear-gradient(to right, ${colors.frostPrimary}, ${colors.frostSecondary})`,
              color: '#FFFFFF',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = `linear-gradient(to right, rgba(79, 70, 229, 0.9), rgba(167, 139, 250, 0.9))`)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = `linear-gradient(to right, ${colors.frostPrimary}, ${colors.frostSecondary})`)
            }
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center space-y-4">
          <p style={{ color: colors.frostText }}>
            Connect your wallet to manage your FROST tokens
          </p>
          <button
            onClick={connectWallet}
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
          {connectError && (
            <div
              className="w-full frost-status"
              style={{ backgroundColor: colors.frostError }}
            >
              {connectError.message}
            </div>
          )}
        </div>
      )}
    </div>
  );

}
export default WalletConnect;
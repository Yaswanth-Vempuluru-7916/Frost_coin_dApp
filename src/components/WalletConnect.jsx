import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { 
    connect,
    error: connectError,
    isPending: isConnecting 
  } = useConnect()
  const { disconnect } = useDisconnect()

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xaa36a7" }],
        })
      }
      await connect({ connector: injected() })
    } catch (error) {
      console.error("Connection error:", error.message)
    }
  }

  return (
    <div className="shrink-0">
      {isConnected ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 text-xs">👤</span>
            </div>
            <p className="font-medium text-gray-700">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>
          <button
            onClick={() => disconnect()}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-red-600 transition-colors cursor-pointer"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
          <p className="mb-4 text-gray-600">Connect your wallet to manage your FROST tokens</p>
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className={`px-6 py-3 rounded-lg font-medium transition-all cursor-pointer ${
              isConnecting 
                ? 'bg-indigo-300 text-white cursor-not-allowed' 
                : 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 shadow-md hover:shadow-lg'
            }`}
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
          {connectError && (
            <p className="text-red-500 text-sm mt-3">{connectError.message}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default WalletConnect
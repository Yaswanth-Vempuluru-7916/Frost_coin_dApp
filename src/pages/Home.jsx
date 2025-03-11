import { useEffect, useState } from 'react'
import { useAccount, useReadContract, useWriteContract } from 'wagmi'
import { parseEther } from 'viem'
import WalletConnect from '../components/WalletConnect'
import TokenABI from '../TokenABI.json'

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS

function Home() {
  const { address, isConnected } = useAccount()
  const [transferTo, setTransferTo] = useState('')
  const [amount, setAmount] = useState('')
  const [transferStatus, setTransferStatus] = useState('')

  // Read balance
  const { data: balance, refetch: refetchBalance, isLoading: balanceLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: TokenABI,
    functionName: 'balanceOf',
    args: [address],
    enabled: !!address,
  })

  // Transfer function
  const { 
    writeContract, 
    isPending: isTransferPending, 
    isSuccess: isTransferSuccess, 
    error: transferError,
    data: txHash
  } = useWriteContract()

  const handleTransfer = async () => {
    try {
      if (!transferTo || !amount) {
        setTransferStatus('Please fill in all fields')
        return
      }

      setTransferStatus('Awaiting confirmation...')
      
      const amountInWei = parseEther(amount.toString())

      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: TokenABI,
        functionName: 'transfer',
        args: [transferTo, amountInWei],
      })
    } catch (err) {
      console.error('Transfer error:', err)
      setTransferStatus(`Error: ${err.message || 'Transaction failed'}`)
    }
  }

  // Handle transfer states
  useEffect(() => {
    if (isTransferPending) {
      setTransferStatus('Processing transaction...')
    } else if (isTransferSuccess && txHash) {
      setTransferStatus('Transfer successful!')
      setTransferTo('')
      setAmount('')
      refetchBalance()
      setTimeout(() => setTransferStatus(''), 3000)
    } else if (transferError) {
      setTransferStatus(`Error: ${transferError.message || 'Unknown error'}`)
      setTimeout(() => setTransferStatus(''), 5000)
    }
  }, [isTransferPending, isTransferSuccess, transferError, txHash, refetchBalance])

  return (
    <div className="flex flex-col h-full w-full items-center justify-between px-4 py-6 overflow-hidden">
      <header className="text-center shrink-0">
        <h1 className="text-5xl font-bold text-indigo-900 mb-3">Frost Coin</h1>
        <p className="text-indigo-600 text-lg">A chillingly cool cryptocurrency</p>
      </header>

      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl flex flex-col flex-grow overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 shrink-0">
          <div className="flex justify-center">
            <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center shadow-lg">
              <span className="text-4xl">❄️</span>
            </div>
          </div>
        </div>
        
        <div className="p-5 flex flex-col flex-grow overflow-hidden">
          <WalletConnect />

          {isConnected ? (
            <div className="mt-6 space-y-4 flex flex-col flex-grow">
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-indigo-500 font-medium">Your Balance</span>
                  <span className="text-xl font-bold text-indigo-900">
                    {balanceLoading ? 'Loading...' : (Number(balance) / 1e18)?.toFixed(2) || '0'} FROST
                  </span>
                </div>
              </div>

              <div className="space-y-3 flex flex-col flex-grow">
                <h3 className="text-lg font-semibold text-gray-700 shrink-0">Transfer Tokens</h3>
                
                <div className="space-y-2 flex flex-col flex-grow">
                  <div className="space-y-2 flex-grow">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Address</label>
                      <input
                        type="text"
                        placeholder="0x..."
                        value={transferTo}
                        onChange={(e) => setTransferTo(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                        disabled={isTransferPending}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                      <input
                        type="number"
                        placeholder="0.0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                        disabled={isTransferPending}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 shrink-0">
                    <button
                      onClick={handleTransfer}
                      disabled={isTransferPending}
                      className={`w-full py-2 rounded-lg text-white font-medium transition-all cursor-pointer ${
                        isTransferPending 
                          ? 'bg-indigo-300 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-md hover:shadow-lg'
                      }`}
                    >
                      {isTransferPending ? 'Processing...' : 'Send Tokens'}
                    </button>

                    {transferStatus && (
                      <div className={`rounded-lg p-2 text-sm shrink-0 ${
                        transferStatus.includes('Error') 
                          ? 'bg-red-50 text-red-700 border border-red-100' 
                          : transferStatus.includes('success') 
                            ? 'bg-green-50 text-green-700 border border-green-100'
                            : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                      }`}>
                        {transferStatus}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 bg-indigo-50 p-5 rounded-xl text-center flex-grow flex items-center justify-center">
              <p className="text-indigo-700">Please connect your wallet to access your tokens</p>
            </div>
          )}
        </div>
      </div>
      
      <footer className="mt-4 text-center text-gray-500 text-sm shrink-0">
        <p>Frost Coin - Cool your crypto portfolio ❄️</p>
      </footer>
    </div>
  )
}

export default Home
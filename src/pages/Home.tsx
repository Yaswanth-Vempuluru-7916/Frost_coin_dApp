import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import WalletConnect from '../components/WalletConnect';
import OwnerControls from '../components/OwnerControls';
import TokenABI from '../../contracts/TokenABI.json';
import { formatBalance, isValidAddress } from '../utils/helpers';

const CONTRACT_ADDRESS: string = import.meta.env.VITE_CONTRACT_ADDRESS;

function Home() {
  const [address, setAddress] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [transferTo, setTransferTo] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [transferStatus, setTransferStatus] = useState<string>('');
  const [balance, setBalance] = useState<ethers.BigNumberish | null>(null);
  const [totalSupply, setTotalSupply] = useState<ethers.BigNumberish | null>(null);
  const [cap, setCap] = useState<ethers.BigNumberish | null>(null);
  const [isTransferPending, setIsTransferPending] = useState<boolean>(false);
  const [balanceLoading, setBalanceLoading] = useState<boolean>(false);
  const [totalSupplyLoading, setTotalSupplyLoading] = useState<boolean>(false);
  const [capLoading, setCapLoading] = useState<boolean>(false);
  const [isOwner, setIsOwner] = useState<boolean>(false);

  // State for approve
  const [approveSpender, setApproveSpender] = useState<string>('');
  const [approveAmount, setApproveAmount] = useState<string>('');
  const [approveStatus, setApproveStatus] = useState<string>('');
  const [isApprovePending, setIsApprovePending] = useState<boolean>(false);

  // State for increaseAllowance
  const [increaseSpender, setIncreaseSpender] = useState<string>('');
  const [increaseAmount, setIncreaseAmount] = useState<string>('');
  const [increaseStatus, setIncreaseStatus] = useState<string>('');
  const [isIncreasePending, setIsIncreasePending] = useState<boolean>(false);

  // State for decreaseAllowance
  const [decreaseSpender, setDecreaseSpender] = useState<string>('');
  const [decreaseAmount, setDecreaseAmount] = useState<string>('');
  const [decreaseStatus, setDecreaseStatus] = useState<string>('');
  const [isDecreasePending, setIsDecreasePending] = useState<boolean>(false);

  // State for burnFrom
  const [burnFromAddress, setBurnFromAddress] = useState<string>('');
  const [burnFromAmount, setBurnFromAmount] = useState<string>('');
  const [burnFromStatus, setBurnFromStatus] = useState<string>('');
  const [isBurnFromPending, setIsBurnFromPending] = useState<boolean>(false);

  // Setup listeners for wallet connection changes
  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        fetchData(accounts[0]);
      } else {
        setAddress('');
        setIsConnected(false);
        setBalance(null);
        setIsOwner(false);
      }
    };

    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then(handleAccountsChanged)
        .catch(console.error);

      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  // Fetch contract data (including owner)
  const fetchData = async (userAddress: string) => {
    try {
      if (!window.ethereum) {
        throw new Error("No Ethereum wallet detected");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const tokenContract = new ethers.Contract(CONTRACT_ADDRESS, TokenABI, provider);
      
      setTotalSupplyLoading(true);
      const supplyResult = await tokenContract.totalSupply();
      setTotalSupply(supplyResult);
      setTotalSupplyLoading(false);
      
      setCapLoading(true);
      const capResult = await tokenContract.cap();
      setCap(capResult);
      setCapLoading(false);
      
      if (userAddress) {
        setBalanceLoading(true);
        const balanceResult = await tokenContract.balanceOf(userAddress);
        setBalance(balanceResult);
        setBalanceLoading(false);

        const ownerAddress = await tokenContract.owner();
        setIsOwner(userAddress.toLowerCase() === ownerAddress.toLowerCase());
      }
    } catch (error) {
      console.error("Error fetching contract data:", error);
      setTotalSupplyLoading(false);
      setCapLoading(false);
      setBalanceLoading(false);
      setIsOwner(false);
    }
  };

  // Refresh user balance
  const refreshBalance = async () => {
    if (isConnected && address) {
      try {
        if (!window.ethereum) {
          throw new Error("No Ethereum wallet detected");
        }

        setBalanceLoading(true);
        const provider = new ethers.BrowserProvider(window.ethereum);
        const tokenContract = new ethers.Contract(CONTRACT_ADDRESS, TokenABI, provider);
        const balanceResult = await tokenContract.balanceOf(address);
        setBalance(balanceResult);
      } catch (error) {
        console.error("Error refreshing balance:", error);
      } finally {
        setBalanceLoading(false);
      }
    }
  };

  // Handle transfer
  const handleTransfer = async () => {
    try {
      if (!transferTo || !amount) {
        setTransferStatus('Please fill in all fields');
        return;
      }

      if (!isValidAddress(transferTo)) {
        setTransferStatus('Invalid recipient address');
        return;
      }

      setTransferStatus('Awaiting confirmation...');
      setIsTransferPending(true);
      
      if (!window.ethereum) {
        throw new Error("No Ethereum wallet detected");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(CONTRACT_ADDRESS, TokenABI, signer);
      
      const amountInWei = ethers.parseEther(amount.toString());
      
      try {
        await tokenContract.transfer.estimateGas(transferTo, amountInWei);
      } catch (error: any) {
        let errorMessage = 'Transaction will fail';
        if (error.message?.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for gas or transfer';
        } else if (error.message?.includes('transfer amount exceeds balance')) {
          errorMessage = 'Insufficient FROST balance';
        } else if (error.message?.includes('self-transfer not allowed')) {
          errorMessage = 'Cannot transfer to yourself';
        }
        throw new Error(errorMessage);
      }
      
      const tx = await tokenContract.transfer(transferTo, amountInWei);
      setTransferStatus('Processing transaction...');
      
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        setTransferStatus('Transfer successful!');
        setTransferTo('');
        setAmount('');
        refreshBalance();
        setTimeout(() => setTransferStatus(''), 3000);
      } else {
        setTransferStatus('Error: Transaction failed');
      }
    } catch (err: any) {
      console.error('Transfer error:', err);
      let errorMessage = 'Transaction failed';
      if (err.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas or transfer';
      } else if (err.message?.includes('user rejected')) {
        errorMessage = 'Transaction rejected in wallet';
      } else if (err.message?.includes('transfer amount exceeds balance')) {
        errorMessage = 'Insufficient FROST balance';
      } else if (err.message?.includes('self-transfer not allowed')) {
        errorMessage = 'Cannot transfer to yourself';
      } else {
        errorMessage = err.message || 'Unknown error';
      }
      setTransferStatus(`Error: ${errorMessage}`);
      setTimeout(() => setTransferStatus(''), 5000);
    } finally {
      setIsTransferPending(false);
    }
  };

  // Handle approve
  const handleApprove = async () => {
    try {
      if (!approveSpender || !approveAmount) {
        setApproveStatus('Please fill in all fields');
        return;
      }

      if (!isValidAddress(approveSpender)) {
        setApproveStatus('Invalid spender address');
        return;
      }

      setApproveStatus('Awaiting confirmation...');
      setIsApprovePending(true);

      if (!window.ethereum) {
        throw new Error("No Ethereum wallet detected");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(CONTRACT_ADDRESS, TokenABI, signer);

      const amountInWei = ethers.parseEther(approveAmount.toString());

      try {
        await tokenContract.approve.estimateGas(approveSpender, amountInWei);
      } catch (error: any) {
        let errorMessage = 'Transaction will fail';
        if (error.message?.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for gas';
        }
        throw new Error(errorMessage);
      }

      const tx = await tokenContract.approve(approveSpender, amountInWei);
      setApproveStatus('Processing transaction...');

      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setApproveStatus('Approval successful!');
        setApproveSpender('');
        setApproveAmount('');
        setTimeout(() => setApproveStatus(''), 3000);
      } else {
        setApproveStatus('Error: Transaction failed');
      }
    } catch (err: any) {
      console.error('Approve error:', err);
      let errorMessage = 'Transaction failed';
      if (err.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas';
      } else if (err.message?.includes('user rejected')) {
        errorMessage = 'Transaction rejected in wallet';
      } else {
        errorMessage = err.message || 'Unknown error';
      }
      setApproveStatus(`Error: ${errorMessage}`);
      setTimeout(() => setApproveStatus(''), 5000);
    } finally {
      setIsApprovePending(false);
    }
  };

  // Handle increaseAllowance
  const handleIncreaseAllowance = async () => {
    try {
      if (!increaseSpender || !increaseAmount) {
        setIncreaseStatus('Please fill in all fields');
        return;
      }

      if (!isValidAddress(increaseSpender)) {
        setIncreaseStatus('Invalid spender address');
        return;
      }

      setIncreaseStatus('Awaiting confirmation...');
      setIsIncreasePending(true);

      if (!window.ethereum) {
        throw new Error("No Ethereum wallet detected");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(CONTRACT_ADDRESS, TokenABI, signer);

      const amountInWei = ethers.parseEther(increaseAmount.toString());

      try {
        await tokenContract.increaseAllowance.estimateGas(increaseSpender, amountInWei);
      } catch (error: any) {
        let errorMessage = 'Transaction will fail';
        if (error.message?.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for gas';
        }
        throw new Error(errorMessage);
      }

      const tx = await tokenContract.increaseAllowance(increaseSpender, amountInWei);
      setIncreaseStatus('Processing transaction...');

      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setIncreaseStatus('Allowance increase successful!');
        setIncreaseSpender('');
        setIncreaseAmount('');
        setTimeout(() => setIncreaseStatus(''), 3000);
      } else {
        setIncreaseStatus('Error: Transaction failed');
      }
    } catch (err: any) {
      console.error('Increase allowance error:', err);
      let errorMessage = 'Transaction failed';
      if (err.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas';
      } else if (err.message?.includes('user rejected')) {
        errorMessage = 'Transaction rejected in wallet';
      } else {
        errorMessage = err.message || 'Unknown error';
      }
      setIncreaseStatus(`Error: ${errorMessage}`);
      setTimeout(() => setIncreaseStatus(''), 5000);
    } finally {
      setIsIncreasePending(false);
    }
  };

  // Handle decreaseAllowance
  const handleDecreaseAllowance = async () => {
    try {
      if (!decreaseSpender || !decreaseAmount) {
        setDecreaseStatus('Please fill in all fields');
        return;
      }

      if (!isValidAddress(decreaseSpender)) {
        setDecreaseStatus('Invalid spender address');
        return;
      }

      setDecreaseStatus('Awaiting confirmation...');
      setIsDecreasePending(true);

      if (!window.ethereum) {
        throw new Error("No Ethereum wallet detected");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(CONTRACT_ADDRESS, TokenABI, signer);

      const amountInWei = ethers.parseEther(decreaseAmount.toString());

      try {
        await tokenContract.decreaseAllowance.estimateGas(decreaseSpender, amountInWei);
      } catch (error: any) {
        let errorMessage = 'Transaction will fail';
        if (error.message?.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for gas';
        } else if (error.message?.includes('decreased allowance below zero')) {
          errorMessage = 'Cannot decrease allowance below zero';
        }
        throw new Error(errorMessage);
      }

      const tx = await tokenContract.decreaseAllowance(decreaseSpender, amountInWei);
      setDecreaseStatus('Processing transaction...');

      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setDecreaseStatus('Allowance decrease successful!');
        setDecreaseSpender('');
        setDecreaseAmount('');
        setTimeout(() => setDecreaseStatus(''), 3000);
      } else {
        setDecreaseStatus('Error: Transaction failed');
      }
    } catch (err: any) {
      console.error('Decrease allowance error:', err);
      let errorMessage = 'Transaction failed';
      if (err.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas';
      } else if (err.message?.includes('user rejected')) {
        errorMessage = 'Transaction rejected in wallet';
      } else if (err.message?.includes('decreased allowance below zero')) {
        errorMessage = 'Cannot decrease allowance below zero';
      } else {
        errorMessage = err.message || 'Unknown error';
      }
      setDecreaseStatus(`Error: ${errorMessage}`);
      setTimeout(() => setDecreaseStatus(''), 5000);
    } finally {
      setIsDecreasePending(false);
    }
  };

  // Handle burnFrom
  const handleBurnFrom = async () => {
    try {
      if (!burnFromAddress || !burnFromAmount) {
        setBurnFromStatus('Please fill in all fields');
        return;
      }

      if (!isValidAddress(burnFromAddress)) {
        setBurnFromStatus('Invalid target address');
        return;
      }

      setBurnFromStatus('Awaiting confirmation...');
      setIsBurnFromPending(true);

      if (!window.ethereum) {
        throw new Error("No Ethereum wallet detected");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(CONTRACT_ADDRESS, TokenABI, signer);

      const amountInWei = ethers.parseEther(burnFromAmount.toString());

      try {
        await tokenContract.burnFrom.estimateGas(burnFromAddress, amountInWei);
      } catch (error: any) {
        let errorMessage = 'Transaction will fail';
        if (error.message?.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for gas';
        } else if (error.message?.includes('burn amount exceeds balance')) {
          errorMessage = 'Burn amount exceeds balance';
        } else if (error.message?.includes('insufficient allowance')) {
          errorMessage = 'Insufficient allowance';
        }
        throw new Error(errorMessage);
      }

      const tx = await tokenContract.burnFrom(burnFromAddress, amountInWei);
      setBurnFromStatus('Processing transaction...');

      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setBurnFromStatus('Burn successful!');
        setBurnFromAddress('');
        setBurnFromAmount('');
        refreshBalance();
        setTimeout(() => setBurnFromStatus(''), 3000);
      } else {
        setBurnFromStatus('Error: Transaction failed');
      }
    } catch (err: any) {
      console.error('Burn from error:', err);
      let errorMessage = 'Transaction failed';
      if (err.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas';
      } else if (err.message?.includes('user rejected')) {
        errorMessage = 'Transaction rejected in wallet';
      } else if (err.message?.includes('burn amount exceeds balance')) {
        errorMessage = 'Burn amount exceeds balance';
      } else if (err.message?.includes('insufficient allowance')) {
        errorMessage = 'Insufficient allowance';
      } else {
        errorMessage = err.message || 'Unknown error';
      }
      setBurnFromStatus(`Error: ${errorMessage}`);
      setTimeout(() => setBurnFromStatus(''), 5000);
    } finally {
      setIsBurnFromPending(false);
    }
  };

  const onConnected = (newAddress: string) => {
    setAddress(newAddress);
    setIsConnected(true);
    fetchData(newAddress);
  };

  const onDisconnected = () => {
    setAddress('');
    setIsConnected(false);
    setBalance(null);
    setIsOwner(false);
  };

  return (
    <div className="frost-container">
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold text-blue-700">Frost Coin</h1>
        <p className="text-blue-600 text-sm">A chillingly cool cryptocurrency</p>
      </div>

      <div className="frost-stats">
        <div className="frost-stat-item">
          <span className="frost-stat-label">Total Supply</span>
          <span className="frost-stat-value">
            {totalSupplyLoading ? 'Loading...' : formatBalance(totalSupply)} FROST
          </span>
        </div>
        <div className="frost-stat-item">
          <span className="frost-stat-label">Cap</span>
          <span className="frost-stat-value">
            {capLoading ? 'Loading...' : formatBalance(cap)} FROST
          </span>
        </div>
      </div>

      <div className="frost-card">
        <WalletConnect
          currentAddress={address}
          isConnected={isConnected}
          onConnected={onConnected}
          onDisconnected={onDisconnected}
        />
        
        {isConnected ? (
          <div className="mt-3">
            <div className="frost-panel mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-600 font-medium">Your Balance</span>
                <span className="text-base font-bold text-blue-800">
                  {balanceLoading ? 'Loading...' : formatBalance(balance)} FROST
                </span>
              </div>
            </div>

            {/* All functional sections using grid layout */}
            <div className="frost-grid">
              {/* Transfer Tokens */}
              <div className="frost-panel">
                <h3>Transfer Tokens</h3>
                <div className="frost-input-group">
                  <label>Recipient Address</label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    disabled={isTransferPending}
                  />
                </div>
                <div className="frost-input-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={isTransferPending}
                  />
                </div>
                <button
                  onClick={handleTransfer}
                  disabled={isTransferPending}
                  className="w-full"
                >
                  {isTransferPending ? 'Processing...' : 'Send Tokens'}
                </button>
                {transferStatus && (
                  <div className={`frost-status ${
                    transferStatus.includes('Error') ? 'frost-status-error' : 
                    transferStatus.includes('Success') ? 'frost-status-success' : 'frost-status-pending'
                  }`}>
                    {transferStatus}
                  </div>
                )}
              </div>

              {/* Approve */}
              <div className="frost-panel">
                <h3>Approve Spender</h3>
                <div className="frost-input-group">
                  <label>Spender Address</label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={approveSpender}
                    onChange={(e) => setApproveSpender(e.target.value)}
                    disabled={isApprovePending}
                  />
                </div>
                <div className="frost-input-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    placeholder="0.0"
                    value={approveAmount}
                    onChange={(e) => setApproveAmount(e.target.value)}
                    disabled={isApprovePending}
                  />
                </div>
                <button onClick={handleApprove} disabled={isApprovePending} className="w-full">
                  {isApprovePending ? 'Processing...' : 'Approve'}
                </button>
                {approveStatus && (
                  <div className={`frost-status ${
                    approveStatus.includes('Error') ? 'frost-status-error' : 
                    approveStatus.includes('Success') ? 'frost-status-success' : 'frost-status-pending'
                  }`}>
                    {approveStatus}
                  </div>
                )}
              </div>

              {/* Increase Allowance */}
              <div className="frost-panel">
                <h3>Increase Allowance</h3>
                <div className="frost-input-group">
                  <label>Spender Address</label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={increaseSpender}
                    onChange={(e) => setIncreaseSpender(e.target.value)}
                    disabled={isIncreasePending}
                  />
                </div>
                <div className="frost-input-group">
                  <label>Amount to Increase</label>
                  <input
                    type="number"
                    placeholder="0.0"
                    value={increaseAmount}
                    onChange={(e) => setIncreaseAmount(e.target.value)}
                    disabled={isIncreasePending}
                  />
                </div>
                <button onClick={handleIncreaseAllowance} disabled={isIncreasePending} className="w-full">
                  {isIncreasePending ? 'Processing...' : 'Increase Allowance'}
                </button>
                {increaseStatus && (
                  <div className={`frost-status ${
                    increaseStatus.includes('Error') ? 'frost-status-error' : 
                    increaseStatus.includes('Success') ? 'frost-status-success' : 'frost-status-pending'
                  }`}>
                    {increaseStatus}
                  </div>
                )}
              </div>

              {/* Decrease Allowance */}
              <div className="frost-panel">
                <h3>Decrease Allowance</h3>
                <div className="frost-input-group">
                  <label>Spender Address</label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={decreaseSpender}
                    onChange={(e) => setDecreaseSpender(e.target.value)}
                    disabled={isDecreasePending}
                  />
                </div>
                <div className="frost-input-group">
                  <label>Amount to Decrease</label>
                  <input
                    type="number"
                    placeholder="0.0"
                    value={decreaseAmount}
                    onChange={(e) => setDecreaseAmount(e.target.value)}
                    disabled={isDecreasePending}
                  />
                </div>
                <button onClick={handleDecreaseAllowance} disabled={isDecreasePending} className="w-full">
                  {isDecreasePending ? 'Processing...' : 'Decrease Allowance'}
                </button>
                {decreaseStatus && (
                  <div className={`frost-status ${
                    decreaseStatus.includes('Error') ? 'frost-status-error' : 
                    decreaseStatus.includes('Success') ? 'frost-status-success' : 'frost-status-pending'
                  }`}>
                    {decreaseStatus}
                  </div>
                )}
              </div>

              {/* Burn From */}
              <div className="frost-panel">
                <h3>Burn From</h3>
                <div className="frost-input-group">
                  <label>Target Address</label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={burnFromAddress}
                    onChange={(e) => setBurnFromAddress(e.target.value)}
                    disabled={isBurnFromPending}
                  />
                </div>
                <div className="frost-input-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    placeholder="0.0"
                    value={burnFromAmount}
                    onChange={(e) => setBurnFromAmount(e.target.value)}
                    disabled={isBurnFromPending}
                  />
                </div>
                <button onClick={handleBurnFrom} disabled={isBurnFromPending} className="w-full">
                  {isBurnFromPending ? 'Processing...' : 'Burn From'}
                </button>
                {burnFromStatus && (
                  <div className={`frost-status ${
                    burnFromStatus.includes('Error') ? 'frost-status-error' : 
                    burnFromStatus.includes('Success') ? 'frost-status-success' : 'frost-status-pending'
                  }`}>
                    {burnFromStatus}
                  </div>
                )}
              </div>
            </div>

            {/* Owner Controls - Full width */}
            {isOwner && (
              <div className="frost-panel border-blue-300 bg-blue-100/80 mt-3">
                <h3 className="text-blue-800">Owner Controls</h3>
                <OwnerControls />
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-blue-600 mb-2">Please connect your wallet to access your tokens</p>
            <div className="animate-pulse text-blue-400 text-4xl mb-2">❄</div>
          </div>
        )}
      </div>

      <footer className="frost-footer">
        <p>Frost Coin - Cool your crypto portfolio</p>
      </footer>
    </div>
  );
}

export default Home;
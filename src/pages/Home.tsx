import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import WalletConnect from '../components/WalletConnect';
import OwnerControls from '../components/OwnerControls';
import TokenABI from '../../contracts/TokenABI.json';
import { formatBalance, isValidAddress } from '../utils/helpers';
import { colors } from '../styles/colors';

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

  // Add to existing state declarations
  const [transferFromFrom, setTransferFromFrom] = useState<string>('');
  const [transferFromTo, setTransferFromTo] = useState<string>('');
  const [transferFromAmount, setTransferFromAmount] = useState<string>('');
  const [transferFromStatus, setTransferFromStatus] = useState<string>('');
  const [isTransferFromPending, setIsTransferFromPending] = useState<boolean>(false);
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

  const handleTransferFrom = async () => {
    try {
      if (!transferFromFrom || !transferFromTo || !transferFromAmount) {
        setTransferFromStatus('Please fill in all fields');
        return;
      }

      if (!isValidAddress(transferFromFrom) || !isValidAddress(transferFromTo)) {
        setTransferFromStatus('Invalid address');
        return;
      }

      if (parseFloat(transferFromAmount) <= 0) {
        setTransferFromStatus('Amount must be greater than zero');
        return;
      }

      setTransferFromStatus('Awaiting confirmation...');
      setIsTransferFromPending(true);

      if (!window.ethereum) {
        throw new Error('No Ethereum wallet detected');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(CONTRACT_ADDRESS, TokenABI, signer);

      const amountInWei = ethers.parseEther(transferFromAmount.toString());

      try {
        await tokenContract.transferFrom.estimateGas(transferFromFrom, transferFromTo, amountInWei);
      } catch (error: any) {
        let errorMessage = 'Transaction will fail';
        if (error.message?.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for gas';
        } else if (error.message?.includes('insufficient allowance')) {
          errorMessage = 'Insufficient allowance';
        } else if (error.message?.includes('transfer amount exceeds balance')) {
          errorMessage = 'Owner has insufficient FROST balance';
        } else if (error.message?.includes('self-transfer not allowed')) {
          errorMessage = 'Cannot transfer to the same address';
        }
        throw new Error(errorMessage);
      }

      const tx = await tokenContract.transferFrom(transferFromFrom, transferFromTo, amountInWei);
      setTransferFromStatus('Processing transaction...');

      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setTransferFromStatus('Transfer successful!');
        setTransferFromFrom('');
        setTransferFromTo('');
        setTransferFromAmount('');
        refreshBalance(); // Refresh balance if the spender is also the owner or recipient
        setTimeout(() => setTransferFromStatus(''), 3000);
      } else {
        setTransferFromStatus('Error: Transaction failed');
      }
    } catch (err: any) {
      console.error('TransferFrom error:', err);
      let errorMessage = 'Transaction failed';
      if (err.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas';
      } else if (err.message?.includes('user rejected')) {
        errorMessage = 'Transaction rejected in wallet';
      } else if (err.message?.includes('insufficient allowance')) {
        errorMessage = 'Insufficient allowance';
      } else if (err.message?.includes('transfer amount exceeds balance')) {
        errorMessage = 'Owner has insufficient FROST balance';
      } else if (err.message?.includes('self-transfer not allowed')) {
        errorMessage = 'Cannot transfer to the same address';
      } else {
        errorMessage = err.message || 'Unknown error';
      }
      setTransferFromStatus(`Error: ${errorMessage}`);
      setTimeout(() => setTransferFromStatus(''), 5000);
    } finally {
      setIsTransferFromPending(false);
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
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: `linear-gradient(to bottom, ${colors.frostFrosty}, ${colors.frostTertiary})`,
      }}
    >
      {/* Header */}
      <header className="text-center py-6 sm:py-8">
        <h1 className="text-4xl sm:text-5xl font-bold mb-2">Frost Coin</h1>
        <p style={{ color: colors.frostText, fontSize: '1.125rem' }}>
          A chillingly cool cryptocurrency
        </p>
      </header>

      {/* Main Content */}
      <main className="flex-grow frost-container">
        {/* Token Info and Wallet Connect - Side by Side on Medium Screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Token Information */}
          <div className="frost-card">
            <h3>Token Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span style={{ color: colors.frostText }}>Total Supply:</span>
                <span style={{ color: colors.frostPrimary, fontWeight: 500 }}>
                  {totalSupplyLoading ? 'Loading...' : formatBalance(totalSupply)} FROST
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: colors.frostText }}>Cap:</span>
                <span style={{ color: colors.frostPrimary, fontWeight: 500 }}>
                  {capLoading ? 'Loading...' : formatBalance(cap)} FROST
                </span>
              </div>
            </div>
          </div>

          {/* Wallet Connect */}
          <div className="frost-card">
            <WalletConnect
              currentAddress={address}
              isConnected={isConnected}
              onConnected={onConnected}
              onDisconnected={onDisconnected}
            />
          </div>
        </div>

        {/* Connected Wallet Actions */}
        {isConnected ? (
          <div>
            {/* Balance */}
            <div
              className="frost-card"
              style={{ backgroundColor: colors.frostSnow }}
            >
              <div className="flex justify-between items-center">
                <span style={{ fontSize: '1.125rem', fontWeight: 500, color: colors.frostText }}>
                  Your Balance:
                </span>
                <span style={{ fontSize: '1.125rem', color: colors.frostPrimary, fontWeight: 500 }}>
                  {balanceLoading ? 'Loading...' : formatBalance(balance)} FROST
                </span>
              </div>
            </div>

            {/* User Actions */}
            <div className="frost-card">
              <h3>Manage Tokens</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Transfer Tokens */}
                <div className="space-y-4">
                  <h4>Transfer Tokens</h4>
                  <div>
                    <label>Recipient Address</label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={transferTo}
                      onChange={(e) => setTransferTo(e.target.value)}
                      disabled={isTransferPending}
                    />
                  </div>
                  <div>
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
                  >
                    {isTransferPending ? 'Processing...' : 'Send Tokens'}
                  </button>
                  {transferStatus && (
                    <div
                      className="frost-status"
                      style={{
                        backgroundColor: transferStatus.includes('Error')
                          ? colors.frostError
                          : transferStatus.includes('successful')
                            ? colors.frostSuccess
                            : colors.frostInfo,
                      }}
                    >
                      {transferStatus}
                    </div>
                  )}
                </div>

                {/* Approve Spender */}
                <div className="space-y-4">
                  <h4>Approve Spender</h4>
                  <div>
                    <label>Spender Address</label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={approveSpender}
                      onChange={(e) => setApproveSpender(e.target.value)}
                      disabled={isApprovePending}
                    />
                  </div>
                  <div>
                    <label>Amount</label>
                    <input
                      type="number"
                      placeholder="0.0"
                      value={approveAmount}
                      onChange={(e) => setApproveAmount(e.target.value)}
                      disabled={isApprovePending}
                    />
                  </div>
                  <button
                    onClick={handleApprove}
                    disabled={isApprovePending}
                  >
                    {isApprovePending ? 'Processing...' : 'Approve'}
                  </button>
                  {approveStatus && (
                    <div
                      className="frost-status"
                      style={{
                        backgroundColor: approveStatus.includes('Error')
                          ? colors.frostError
                          : approveStatus.includes('successful')
                            ? colors.frostSuccess
                            : colors.frostInfo,
                      }}
                    >
                      {approveStatus}
                    </div>
                  )}
                </div>

                {/* Add to the grid in "Manage Tokens" */}
                <div className="space-y-4">
                  <h4>Transfer From (Spend Approved Tokens)</h4>
                  <div>
                    <label>Owner Address</label>
                    <input
                      type="text"
                      placeholder="0x... (owner's address)"
                      value={transferFromFrom}
                      onChange={(e) => setTransferFromFrom(e.target.value)}
                      disabled={isTransferFromPending}
                    />
                  </div>
                  <div>
                    <label>Recipient Address</label>
                    <input
                      type="text"
                      placeholder="0x... (recipient)"
                      value={transferFromTo}
                      onChange={(e) => setTransferFromTo(e.target.value)}
                      disabled={isTransferFromPending}
                    />
                  </div>
                  <div>
                    <label>Amount</label>
                    <input
                      type="number"
                      placeholder="0.0"
                      value={transferFromAmount}
                      onChange={(e) => setTransferFromAmount(e.target.value)}
                      disabled={isTransferFromPending}
                    />
                  </div>
                  <button
                    onClick={handleTransferFrom}
                    disabled={isTransferFromPending}
                  >
                    {isTransferFromPending ? 'Processing...' : 'Transfer From'}
                  </button>
                  {transferFromStatus && (
                    <div
                      className="frost-status"
                      style={{
                        backgroundColor: transferFromStatus.includes('Error')
                          ? colors.frostError
                          : transferFromStatus.includes('successful')
                            ? colors.frostSuccess
                            : colors.frostInfo,
                      }}
                    >
                      {transferFromStatus}
                    </div>
                  )}
                </div>

                {/* Increase Allowance */}
                <div className="space-y-4">
                  <h4>Increase Allowance</h4>
                  <div>
                    <label>Spender Address</label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={increaseSpender}
                      onChange={(e) => setIncreaseSpender(e.target.value)}
                      disabled={isIncreasePending}
                    />
                  </div>
                  <div>
                    <label>Amount to Increase</label>
                    <input
                      type="number"
                      placeholder="0.0"
                      value={increaseAmount}
                      onChange={(e) => setIncreaseAmount(e.target.value)}
                      disabled={isIncreasePending}
                    />
                  </div>
                  <button
                    onClick={handleIncreaseAllowance}
                    disabled={isIncreasePending}
                  >
                    {isIncreasePending ? 'Processing...' : 'Increase Allowance'}
                  </button>
                  {increaseStatus && (
                    <div
                      className="frost-status"
                      style={{
                        backgroundColor: increaseStatus.includes('Error')
                          ? colors.frostError
                          : increaseStatus.includes('successful')
                            ? colors.frostSuccess
                            : colors.frostInfo,
                      }}
                    >
                      {increaseStatus}
                    </div>
                  )}
                </div>

                {/* Decrease Allowance */}
                <div className="space-y-4">
                  <h4>Decrease Allowance</h4>
                  <div>
                    <label>Spender Address</label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={decreaseSpender}
                      onChange={(e) => setDecreaseSpender(e.target.value)}
                      disabled={isDecreasePending}
                    />
                  </div>
                  <div>
                    <label>Amount to Decrease</label>
                    <input
                      type="number"
                      placeholder="0.0"
                      value={decreaseAmount}
                      onChange={(e) => setDecreaseAmount(e.target.value)}
                      disabled={isDecreasePending}
                    />
                  </div>
                  <button
                    onClick={handleDecreaseAllowance}
                    disabled={isDecreasePending}
                  >
                    {isDecreasePending ? 'Processing...' : 'Decrease Allowance'}
                  </button>
                  {decreaseStatus && (
                    <div
                      className="frost-status"
                      style={{
                        backgroundColor: decreaseStatus.includes('Error')
                          ? colors.frostError
                          : decreaseStatus.includes('successful')
                            ? colors.frostSuccess
                            : colors.frostInfo,
                      }}
                    >
                      {decreaseStatus}
                    </div>
                  )}
                </div>

                {/* Burn From */}
                <div className="space-y-4 lg:col-span-2">
                  <h4>Burn From</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label>Target Address</label>
                      <input
                        type="text"
                        placeholder="0x..."
                        value={burnFromAddress}
                        onChange={(e) => setBurnFromAddress(e.target.value)}
                        disabled={isBurnFromPending}
                      />
                    </div>
                    <div>
                      <label>Amount</label>
                      <input
                        type="number"
                        placeholder="0.0"
                        value={burnFromAmount}
                        onChange={(e) => setBurnFromAmount(e.target.value)}
                        disabled={isBurnFromPending}
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleBurnFrom}
                    disabled={isBurnFromPending}
                  >
                    {isBurnFromPending ? 'Processing...' : 'Burn From'}
                  </button>
                  {burnFromStatus && (
                    <div
                      className="frost-status"
                      style={{
                        backgroundColor: burnFromStatus.includes('Error')
                          ? colors.frostError
                          : burnFromStatus.includes('successful')
                            ? colors.frostSuccess
                            : colors.frostInfo,
                      }}
                    >
                      {burnFromStatus}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Owner Controls */}
            {isOwner && (
              <div
                className="frost-card"
                style={{ borderColor: colors.frostWarm }}
              >
                <h3>Owner Controls</h3>
                <OwnerControls />
              </div>
            )}
          </div>
        ) : (
          <div className="frost-card text-center">
            <p style={{ color: colors.frostText }}>
              Please connect your wallet to access your tokens
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-4">
        <p style={{ color: colors.frostText }}>
          Frost Coin - Cool your crypto portfolio
        </p>
      </footer>
    </div>
  );

}

export default Home;
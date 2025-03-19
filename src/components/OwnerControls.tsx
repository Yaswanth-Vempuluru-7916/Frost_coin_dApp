import { useState } from 'react';
import { ethers } from 'ethers';
import TokenABI from '../../contracts/TokenABI.json';
import { isValidAddress } from '../utils/helpers';
import { colors } from '../styles/colors';

const CONTRACT_ADDRESS: string = import.meta.env.VITE_CONTRACT_ADDRESS;

function OwnerControls() {
  // State for minting
  const [mintAddress, setMintAddress] = useState<string>('');
  const [mintAmount, setMintAmount] = useState<string>('');
  const [mintStatus, setMintStatus] = useState<string>('');
  const [isMintPending, setIsMintPending] = useState<boolean>(false);

  // State for burning
  const [burnAddress, setBurnAddress] = useState<string>('');
  const [burnAmount, setBurnAmount] = useState<string>('');
  const [burnStatus, setBurnStatus] = useState<string>('');
  const [isBurnPending, setIsBurnPending] = useState<boolean>(false);

  // State for transferring ownership
  const [newOwnerAddress, setNewOwnerAddress] = useState<string>('');
  const [transferOwnershipStatus, setTransferOwnershipStatus] = useState<string>('');
  const [isTransferOwnershipPending, setIsTransferOwnershipPending] = useState<boolean>(false);

  // Handle minting
  const handleMint = async () => {
    try {
      if (!mintAddress || !mintAmount) {
        setMintStatus('Please fill in all fields');
        return;
      }

      if (!isValidAddress(mintAddress)) {
        setMintStatus('Invalid recipient address');
        return;
      }

      setMintStatus('Awaiting confirmation...');
      setIsMintPending(true);

      if (!window.ethereum) {
        throw new Error("No Ethereum wallet detected");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(CONTRACT_ADDRESS, TokenABI, signer);

      const amountInWei = ethers.parseEther(mintAmount.toString());

      try {
        await tokenContract.mint.estimateGas(mintAddress, amountInWei);
      } catch (error: any) {
        let errorMessage = 'Transaction will fail';
        if (error.message?.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for gas';
        } else if (error.message?.includes('cap exceeded')) {
          errorMessage = 'Minting would exceed the cap';
        } else if (error.message?.includes('caller is not the owner')) {
          errorMessage = 'Only the owner can mint';
        }
        throw new Error(errorMessage);
      }

      const tx = await tokenContract.mint(mintAddress, amountInWei);
      setMintStatus('Processing transaction...');

      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setMintStatus('Mint successful!');
        setMintAddress('');
        setMintAmount('');
        setTimeout(() => setMintStatus(''), 3000);
      } else {
        setMintStatus('Error: Transaction failed');
      }
    } catch (err: any) {
      console.error('Mint error:', err);
      let errorMessage = 'Transaction failed';
      if (err.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas';
      } else if (err.message?.includes('user rejected')) {
        errorMessage = 'Transaction rejected in wallet';
      } else if (err.message?.includes('cap exceeded')) {
        errorMessage = 'Minting would exceed the cap';
      } else if (err.message?.includes('caller is not the owner')) {
        errorMessage = 'Only the owner can mint';
      } else {
        errorMessage = err.message || 'Unknown error';
      }
      setMintStatus(`Error: ${errorMessage}`);
      setTimeout(() => setMintStatus(''), 5000);
    } finally {
      setIsMintPending(false);
    }
  };

  // Handle burning
  const handleBurn = async () => {
    try {
      if (!burnAddress || !burnAmount) {
        setBurnStatus('Please fill in all fields');
        return;
      }

      if (!isValidAddress(burnAddress)) {
        setBurnStatus('Invalid target address');
        return;
      }

      setBurnStatus('Awaiting confirmation...');
      setIsBurnPending(true);

      if (!window.ethereum) {
        throw new Error("No Ethereum wallet detected");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(CONTRACT_ADDRESS, TokenABI, signer);

      const amountInWei = ethers.parseEther(burnAmount.toString());

      try {
        await tokenContract.burn.estimateGas(burnAddress, amountInWei);
      } catch (error: any) {
        let errorMessage = 'Transaction will fail';
        if (error.message?.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for gas';
        } else if (error.message?.includes('burn amount exceeds balance')) {
          errorMessage = 'Burn amount exceeds balance';
        } else if (error.message?.includes('caller is not the owner')) {
          errorMessage = 'Only the owner can burn';
        }
        throw new Error(errorMessage);
      }

      const tx = await tokenContract.burn(burnAddress, amountInWei);
      setBurnStatus('Processing transaction...');

      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setBurnStatus('Burn successful!');
        setBurnAddress('');
        setBurnAmount('');
        setTimeout(() => setBurnStatus(''), 3000);
      } else {
        setBurnStatus('Error: Transaction failed');
      }
    } catch (err: any) {
      console.error('Burn error:', err);
      let errorMessage = 'Transaction failed';
      if (err.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas';
      } else if (err.message?.includes('user rejected')) {
        errorMessage = 'Transaction rejected in wallet';
      } else if (err.message?.includes('burn amount exceeds balance')) {
        errorMessage = 'Burn amount exceeds balance';
      } else if (err.message?.includes('caller is not the owner')) {
        errorMessage = 'Only the owner can burn';
      } else {
        errorMessage = err.message || 'Unknown error';
      }
      setBurnStatus(`Error: ${errorMessage}`);
      setTimeout(() => setBurnStatus(''), 5000);
    } finally {
      setIsBurnPending(false);
    }
  };

  // Handle transfer ownership
  const handleTransferOwnership = async () => {
    try {
      if (!newOwnerAddress) {
        setTransferOwnershipStatus('Please fill in the new owner address');
        return;
      }

      if (!isValidAddress(newOwnerAddress)) {
        setTransferOwnershipStatus('Invalid new owner address');
        return;
      }

      setTransferOwnershipStatus('Awaiting confirmation...');
      setIsTransferOwnershipPending(true);

      if (!window.ethereum) {
        throw new Error("No Ethereum wallet detected");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(CONTRACT_ADDRESS, TokenABI, signer);

      try {
        await tokenContract.transferOwnership.estimateGas(newOwnerAddress);
      } catch (error: any) {
        let errorMessage = 'Transaction will fail';
        if (error.message?.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for gas';
        } else if (error.message?.includes('caller is not the owner')) {
          errorMessage = 'Only the owner can transfer ownership';
        }
        throw new Error(errorMessage);
      }

      const tx = await tokenContract.transferOwnership(newOwnerAddress);
      setTransferOwnershipStatus('Processing transaction...');

      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setTransferOwnershipStatus('Ownership transfer successful!');
        setNewOwnerAddress('');
        setTimeout(() => setTransferOwnershipStatus(''), 3000);
      } else {
        setTransferOwnershipStatus('Error: Transaction failed');
      }
    } catch (err: any) {
      console.error('Transfer ownership error:', err);
      let errorMessage = 'Transaction failed';
      if (err.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas';
      } else if (err.message?.includes('user rejected')) {
        errorMessage = 'Transaction rejected in wallet';
      } else if (err.message?.includes('caller is not the owner')) {
        errorMessage = 'Only the owner can transfer ownership';
      } else {
        errorMessage = err.message || 'Unknown error';
      }
      setTransferOwnershipStatus(`Error: ${errorMessage}`);
      setTimeout(() => setTransferOwnershipStatus(''), 5000);
    } finally {
      setIsTransferOwnershipPending(false);
    }
  };
  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mint Tokens */}
        <div className="space-y-4">
          <h4>Mint Tokens</h4>
          <div>
            <label>Recipient Address</label>
            <input
              type="text"
              placeholder="0x..."
              value={mintAddress}
              onChange={(e) => setMintAddress(e.target.value)}
              disabled={isMintPending}
            />
          </div>
          <div>
            <label>Amount</label>
            <input
              type="number"
              placeholder="0.0"
              value={mintAmount}
              onChange={(e) => setMintAmount(e.target.value)}
              disabled={isMintPending}
            />
          </div>
          <button
            onClick={handleMint}
            disabled={isMintPending}
          >
            {isMintPending ? 'Processing...' : 'Mint Tokens'}
          </button>
          {mintStatus && (
            <div
              className="frost-status"
              style={{
                backgroundColor: mintStatus.includes('Error')
                  ? colors.frostError
                  : mintStatus.includes('successful')
                  ? colors.frostSuccess
                  : colors.frostInfo,
              }}
            >
              {mintStatus}
            </div>
          )}
        </div>
  
        {/* Burn Tokens */}
        <div className="space-y-4">
          <h4>Burn Tokens</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label>Target Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={burnAddress}
                onChange={(e) => setBurnAddress(e.target.value)}
                disabled={isBurnPending}
              />
            </div>
            <div>
              <label>Amount</label>
              <input
                type="number"
                placeholder="0.0"
                value={burnAmount}
                onChange={(e) => setBurnAmount(e.target.value)}
                disabled={isBurnPending}
              />
            </div>
          </div>
          <button
            onClick={handleBurn}
            disabled={isBurnPending}
          >
            {isBurnPending ? 'Processing...' : 'Burn Tokens'}
          </button>
          {burnStatus && (
            <div
              className="frost-status"
              style={{
                backgroundColor: burnStatus.includes('Error')
                  ? colors.frostError
                  : burnStatus.includes('successful')
                  ? colors.frostSuccess
                  : colors.frostInfo,
              }}
            >
              {burnStatus}
            </div>
          )}
        </div>
  
        {/* Transfer Ownership */}
        <div className="space-y-4 lg:col-span-2">
          <h4>Transfer Ownership</h4>
          <div>
            <label>New Owner Address</label>
            <input
              type="text"
              placeholder="0x..."
              value={newOwnerAddress}
              onChange={(e) => setNewOwnerAddress(e.target.value)}
              disabled={isTransferOwnershipPending}
            />
          </div>
          <button
            onClick={handleTransferOwnership}
            disabled={isTransferOwnershipPending}
          >
            {isTransferOwnershipPending ? 'Processing...' : 'Transfer Ownership'}
          </button>
          {transferOwnershipStatus && (
            <div
              className="frost-status"
              style={{
                backgroundColor: transferOwnershipStatus.includes('Error')
                  ? colors.frostError
                  : transferOwnershipStatus.includes('successful')
                  ? colors.frostSuccess
                  : colors.frostInfo,
              }}
            >
              {transferOwnershipStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );

}

export default OwnerControls;
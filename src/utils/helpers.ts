import { ethers } from 'ethers';

// Convert wei to FROST (assuming 18 decimals)
export function formatBalance(weiValue: ethers.BigNumberish | null): string {
  if (!weiValue) return '0';
  return ethers.formatEther(weiValue).toString();
}

// Validate Ethereum address
export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}

// Compare two addresses (case-insensitive)
export function isSameAddress(address1: string, address2: string): boolean {
  if (!address1 || !address2) return false;
  return address1.toLowerCase() === address2.toLowerCase();
}
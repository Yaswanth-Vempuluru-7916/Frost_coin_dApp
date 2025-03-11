# Frost Coin DApp

![FROST_COIN_UI](https://raw.githubusercontent.com/Yaswanth-Vempuluru-7916/Frost_coin_dApp/main/public/assets/images/frost_coin_ui.png)
## Overview

Frost Coin is a chillingly cool cryptocurrency decentralized application (DApp) built using React, `wagmi`, and a custom ERC-20 token smart contract. This DApp allows users to connect their wallets, check their token balance, and transfer Frost Coin (FROST) tokens on the Sepolia test network.

- **Framework**: React
- **Blockchain Integration**: `wagmi` for Ethereum wallet connectivity
- **Network**: Sepolia Test Network (Chain ID: 0xaa36a7)
- **Contract**: ERC-20 Token Contract

## Features
- Wallet connection using MetaMask or other injected providers
- Display of user token balance
- Token transfer functionality
- Responsive design with a full-screen layout
- Environment variable support for secure contract address management

## Prerequisites
- Node.js (v16 or later)
- npm or yarn
- MetaMask wallet installed and configured with Sepolia test network
- Sepolia ETH for gas fees

## Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Yaswanth-Vempuluru-7916/Frost_coin_dApp.git
   cd frost-coin-dapp
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set Up Environment Variables**
   - Create a `.env` file in the root directory.
   - Add the following line with your contract address:
     ```
     VITE_CONTRACT_ADDRESS=0x20e......7d693617
     ```
   - Ensure `.env` is added to `.gitignore` to keep it secure.

4. **Start the Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   Open your browser and navigate to `http://localhost:5173` (or the port specified by Vite).

## Usage
1. **Connect Wallet**:
   - Open the DApp in your browser.
   - Click "Connect Wallet" and approve the connection in MetaMask.
   - Ensure MetaMask is set to the Sepolia network.

2. **Check Balance**:
   - After connecting, your FROST token balance will be displayed.

3. **Transfer Tokens**:
   - Enter the recipient's address and the amount of FROST tokens to transfer.
   - Click "Send Tokens" and confirm the transaction in MetaMask.

## Configuration
- **Contract Address**: Stored in the `.env` file as `VITE_CONTRACT_ADDRESS`. Update this address if deploying a new contract.
- **Network**: The DApp is configured for Sepolia (Chain ID `0xaa36a7`). Ensure your wallet matches this network.

## Contributing
Contributions are welcome! Please fork the repository and submit pull requests for any enhancements or bug fixes.

1. Fork the repository.
2. Create a new branch: `git checkout -b feature-branch`.
3. Commit your changes: `git commit -m "Add new feature"`.
4. Push to the branch: `git push origin feature-branch`.
5. Open a pull request.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements
- Built with love using React and `wagmi`.

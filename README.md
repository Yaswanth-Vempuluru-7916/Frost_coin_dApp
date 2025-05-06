
---

# Frost Coin DApp ❄️

![Frost Coin Logo](https://via.placeholder.com/150.png?text=Frost+Coin) <!-- Replace with your logo if available -->

Frost Coin DApp is a decentralized application (DApp) for interacting with the Frost Coin cryptocurrency, a chillingly cool ERC-20 token on the Ethereum blockchain. This DApp allows users to connect their wallets, view token information (total supply, cap, balance), and perform actions like transferring tokens, approving spenders, managing allowances, burning tokens, and owner-specific operations (minting, burning, transferring ownership). The app features a frosty-themed UI with cool blues, purples, and warm beige accents, built with React, Vite, and Tailwind CSS.

## ✨ Features

- **Wallet Integration**: Connect your Ethereum wallet (e.g., MetaMask) to interact with the Frost Coin smart contract.
- **Token Information**: View the total supply, cap, and your balance of Frost Coin (FROST).
- **User Actions**:
  - Transfer FROST tokens to another address.
  - Approve a spender to use your tokens.
  - Increase or decrease a spender’s allowance.
  - Burn tokens from a specific address (if authorized).
- **Owner Controls** (for the contract owner):
  - Mint new FROST tokens.
  - Burn tokens from the total supply.
  - Transfer ownership of the contract to a new address.
- **Responsive Design**: Optimized for mobile, tablet, and desktop screens.
- **Frosty Theme**: A cool UI with blues (`#4F46E5`, `#A78BFA`), frosty highlights (`#E0F2F1`), and warm accents (`#F5F5DC`).

## 🛠️ Tech Stack

- **Frontend**: React (with TypeScript)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 
- **Blockchain**: Ethereum (interacts with an ERC-20 smart contract)
- **Wallet**: ethers.js (for wallet connection and contract interactions)

## 📂 Project Structure

```
frost-coin-dapp/
├── public/
│   └── index.html        # HTML entry point
├── src/
│   ├── components/
│   │   ├── Home.tsx      # Main page with token info, user actions, and owner controls
│   │   ├── WalletConnect.tsx  # Wallet connection component
│   │   └── OwnerControls.tsx  # Owner-specific actions (mint, burn, transfer ownership)
│   ├── styles/
│   │   ├── colors.ts     # Centralized color definitions
│   │   └── index.css     # Global styles with Tailwind CSS
│   ├── App.tsx           # App root component
│   └── main.tsx          # Entry point for React
├── tailwind.config.ts    # Tailwind CSS configuration (color definitions for reference)
├── vite.config.ts        # Vite configuration
├── package.json          # Dependencies and scripts
└── README.md             # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 18 or higher
- **MetaMask**: Installed in your browser for wallet interactions
- **Ethereum Network**: Access to a testnet (e.g., Sepolia) or mainnet with ETH for gas fees

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Yaswanth-Vempuluru-7916/Frost_coin_dApp.git
   cd Frost_coin_dApp
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   Create a `.env` file in the root directory and add the following:
   ```env
   VITE_CONTRACT_ADDRESS=0xYourContractAddressHere
   ```
   - `VITE_CONTRACT_ADDRESS`: The deployed address of your Frost Coin ERC-20 smart contract.


4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser to see the DApp.

### Building for Production

To create a production build:
```bash
npm run build
```

The output will be in the `dist/` directory, ready for deployment.

## 🖥️ Usage

1. **Connect Your Wallet**:
   - Open the DApp in your browser.
   - Click "Connect Wallet" to connect your MetaMask wallet.
   - Ensure you’re on the correct network (e.g., Sepolia).

2. **View Token Information**:
   - Once connected, you’ll see the total supply, cap, and your FROST balance.

3. **Perform Actions**:
   - **Transfer Tokens**: Enter a recipient address and amount to send FROST tokens.
   - **Approve Spender**: Approve a spender to use a specific amount of your tokens.
   - **Manage Allowance**: Increase or decrease a spender’s allowance.
   - **Burn From**: Burn tokens from a specific address (if authorized).
   - **Owner Actions** (if you’re the contract owner):
     - Mint new tokens to an address.
     - Burn tokens from the total supply.
     - Transfer ownership to a new address.

4. **Check Status Messages**:
   - After each action, a status message will appear (success, error, or info) to confirm the transaction.

## 📜 Smart Contract

The Frost Coin smart contract is an ERC-20 token with additional features:
- Minting and burning capabilities.
- Allowance management (approve, increase/decrease allowance).
- Owner-specific functions (mint, burn, transfer ownership).

**Contract Address**: Deployed at `0xYourContractAddressHere` (update in `.env`).



## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/your-feature`.
3. Make your changes and commit: `git commit -m "Add your feature"`.
4. Push to your branch: `git push origin feature/your-feature`.
5. Open a pull request.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.


---

**Stay frosty with Frost Coin! ❄️**

---

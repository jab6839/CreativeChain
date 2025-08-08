# CreativeChain

CreativeChain is a blockchain-powered content protection and royalty tracking app. It lets creators upload assets, generate watermarks & hashes, verify ownership, and simulate royalties — all from a clean, tabbed UI.

## Features
- 🔐 Asset hashing + watermarking
- 🧾 Buyer verification & proof links
- 💸 Simulated royalty tracking
- 📊 Tabs: Upload, My Files, My Royalties, Insights, Buyer View
- 🧩 (Optional) MetaMask login or mock signer
- 🧾 Export receipts (jsPDF) *(optional)*

## Tech Stack
- React (Vite or CRA), JS/TS
- ethers.js (or web3) for blockchain calls
- jsPDF for receipts
- Simple backend hooks (if needed)

## Run Locally
```bash
# clone
git clone https://github.com/jab6839/CreativeChain.git
cd CreativeChain

# install & run
npm install
npm start

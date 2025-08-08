# CreativeChain Frontend

React app for CreativeChain – media authenticity + simple royalty tracking.

## What’s here
- Upload & preview files (images, video, audio)
- Local keccak256 hashing for watermark integrity
- Tabs: Upload, My Files, My Royalties, Insights, Buyer View
- Downloadable certificates for verified files
- Buyer View with simulated purchase + royalty tracking
- Protected by 2FA (Google Authenticator). Works on its own (QR/TOTP generated locally)

## Requirements
- Node.js 18+
- A browser with ES6 module support
- System time reasonably in sync (for 2FA)

## How to run
```bash
cd frontend
npm install
npm start
# then open http://localhost:3000

Buyer View 2FA:

Go to Buyer View tab

Scan the QR code with Google Authenticator

Enter the generated code to unlock purchase simulation

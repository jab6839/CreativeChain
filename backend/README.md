# CreativeChain Backend

This is the Node.js/Express backend for **CreativeChain**, handling file uploads, hashing, blockchain logging, and royalty simulation.

## Features
- Accepts file uploads from the React frontend.
- Calculates keccak256 hashes for file integrity.
- Stores metadata in a local database (JSON or MongoDB, depending on setup).
- Simulates blockchain recording (can be replaced with real smart contract).
- Returns hash and metadata to frontend.
- Handles royalty tracking for uploaded media.

## Requirements
- Node.js 18+
- npm 9+
- MongoDB (optional if using database mode)

## How to Run
```bash
cd backend
npm install
npm start
Server runs by default on http://localhost:5000.

API Endpoints
POST /upload — accepts file, returns hash & metadata

GET /history — returns upload history

POST /verify — verifies file hash

GET /royalties — returns simulated royalty data

Notes
This backend pairs with the frontend React app.

Ensure CORS is enabled for local testing.

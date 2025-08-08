import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import jsPDF from 'jspdf';
import { QRCodeCanvas } from 'qrcode.react';
import * as OTPAuth from 'otpauth';
import './App.css';

function App() {
  const [account, setAccount] = useState(null);
  const [file, setFile] = useState(null);
  const [hash, setHash] = useState('');
  const [uploadHistory, setUploadHistory] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [showFullHash, setShowFullHash] = useState(false);
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [tab, setTab] = useState('upload');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [purchaseMsg, setPurchaseMsg] = useState('');
  const [verifiedHashes, setVerifiedHashes] = useState({});
  const [lastVerifiedItem, setLastVerifiedItem] = useState(null);

  // 2FA state (client-side only)
  const [tokenInput, setTokenInput] = useState('');
  const [is2FAVerified, setIs2FAVerified] = useState(false);
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [totp, setTotp] = useState(null);
  // const [debugCode, setDebugCode] = useState(''); // OPTIONAL: for temporary debugging

  // Generate/reuse one TOTP secret per browser session and build otpauth URL for QR
  useEffect(() => {
    let secretBase32 = sessionStorage.getItem('cc_2fa_secret_b32');
    if (!secretBase32) {
      // FIX: use constructor to create a random secret (works across versions)
      const secretObj = new OTPAuth.Secret();
      secretBase32 = secretObj.base32;
      sessionStorage.setItem('cc_2fa_secret_b32', secretBase32);
    }
    const secret = OTPAuth.Secret.fromBase32(secretBase32);

    const totpObj = new OTPAuth.TOTP({
      issuer: 'CreativeChain',
      label: 'CreativeChain Buyer',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret
    });
    setTotp(totpObj);
    setOtpauthUrl(totpObj.toString()); // otpauth:// URI for QR
  }, []);

  // OPTIONAL: show current code every 2s for debugging (remove before submitting)
  // useEffect(() => {
  //   if (!totp) return;
  //   const id = setInterval(() => setDebugCode(totp.generate()), 2000);
  //   return () => clearInterval(id);
  // }, [totp]);

  const reset2FA = () => {
    sessionStorage.removeItem('cc_2fa_secret_b32');
    setIs2FAVerified(false);
    setTokenInput('');
    // easiest way to rebuild secret & QR
    window.location.reload();
  };

  const verifyToken = () => {
    if (!totp) return;
    // widen window to tolerate clock drift (±2 steps = up to ~60s either side)
    const delta = totp.validate({ token: tokenInput.trim(), window: 2 });
    if (delta !== null) {
      setIs2FAVerified(true);
      alert('2FA Verified ✅');
    } else {
      alert('Invalid token ❌');
    }
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        setAccount(accounts[0]);
      } catch (err) {
        alert('User denied wallet connection.');
      }
    } else {
      alert('Please install MetaMask.');
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
  };

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    setFile(uploadedFile);
    setPreviewUrl(uploadedFile ? URL.createObjectURL(uploadedFile) : null);

    if (uploadedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        const buffer = reader.result;
        const hexHash = ethers.keccak256(new Uint8Array(buffer));
        setHash(hexHash);
      };
      reader.readAsArrayBuffer(uploadedFile);
    }
  };

  const handleUpload = () => {
    if (!file || !hash) return;

    const formattedDate = new Date().toLocaleDateString('en-US', {
      year: '2-digit',
      month: 'numeric',
      day: 'numeric',
    });

    const entry = {
      name: file.name,
      hash: hash,
      timestamp: formattedDate,
    };

    setUploadHistory([entry, ...uploadHistory]);
  };

  const handleVerify = (hash) => {
    setVerifiedHashes((prev) => ({ ...prev, [hash]: true }));
    const item = uploadHistory.find((item) => item.hash === hash);
    setLastVerifiedItem(item || null);
  };

  const handlePurchase = (item) => {
    if (!is2FAVerified) {
      alert('Please verify with 2FA before purchasing.');
      return;
    }

    setPurchaseHistory((prev) => [item, ...prev]);
    setPurchaseMsg(`✅ "${item.name}" purchased successfully. Royalty logged.`);
    setTimeout(() => setPurchaseMsg(''), 3000);
  };

  const handleDownloadCertificate = () => {
    if (!lastVerifiedItem) return;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('🎓 CreativeChain Authenticity Certificate', 15, 20);

    doc.setFontSize(12);
    doc.text(`File Name: ${lastVerifiedItem.name}`, 15, 40);
    doc.text(`Hash: ${lastVerifiedItem.hash}`, 15, 50);
    doc.text(`Timestamp: ${lastVerifiedItem.timestamp}`, 15, 60);
    if (account) {
      doc.text(`Verified by Wallet: ${account}`, 15, 70);
    }

    doc.setFontSize(10);
    doc.text(
      'This certificate verifies that the uploaded file matches a registered asset on CreativeChain.',
      15,
      85
    );

    doc.save(`CreativeChain-Certificate-${lastVerifiedItem.name}.pdf`);
  };

  const shorten = (str) => (str ? `${str.substring(0, 6)}...${str.slice(-6)}` : '');

  const renderPreview = () => {
    if (!previewUrl || !file) return null;
    const fileType = file.type;

    if (fileType.startsWith('video/')) {
      return <video src={previewUrl} controls width="300" />;
    } else if (fileType.startsWith('audio/')) {
      return (
        <>
          <audio
            src={previewUrl}
            controls
            style={{ width: '300px' }}
            playbackRate={playbackSpeed}
          />
          <div>
            <label>Playback Speed: </label>
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            >
              <option value="0.5">0.5x</option>
              <option value="1">1x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>
          </div>
        </>
      );
    } else if (fileType.startsWith('image/')) {
      return <img src={previewUrl} alt="Uploaded preview" width="300" />;
    } else {
      return <p>No preview available for this file type.</p>;
    }
  };

  return (
    <div className="App">
      <h1>CreativeChain</h1>

      {account ? (
        <>
          <p>
            Connected: {showFullAddress ? account : shorten(account)}{' '}
            <button
              className="small-btn"
              onClick={() => setShowFullAddress(!showFullAddress)}
            >
              {showFullAddress ? 'Hide' : 'Show full'}
            </button>
          </p>
          <button className="small-btn" onClick={disconnectWallet}>
            Disconnect
          </button>
        </>
      ) : (
        <button onClick={connectWallet} className="connect-btn">
          Connect Wallet
        </button>
      )}

      <div className="tabs">
        <button onClick={() => setTab('upload')}>Upload</button>
        <button onClick={() => setTab('files')}>My Files</button>
        <button onClick={() => setTab('royalties')}>My Royalties</button>
        <button onClick={() => setTab('insights')}>Insights</button>
        <button onClick={() => setTab('buyer')}>Buyer View</button>
      </div>

      {tab === 'upload' && (
        <div className="upload-section">
          <h2>Upload a File</h2>
          <input type="file" onChange={handleFileChange} />
          <button onClick={handleUpload}>Upload & Watermark</button>

          {hash && (
            <>
              <p className="success">✅ File is ready for upload.</p>
              <p>
                <strong>Hash:</strong>{' '}
                {showFullHash ? hash : shorten(hash)}{' '}
                <button
                  className="small-btn"
                  onClick={() => setShowFullHash(!showFullHash)}
                >
                  {showFullHash ? 'Hide' : 'Show full'}
                </button>
              </p>
              <p><strong>Preview:</strong></p>
              {renderPreview()}
            </>
          )}
        </div>
      )}

      {tab === 'files' && (
        <div className="history-section">
          <h3>My Files</h3>
          {uploadHistory.map((item, index) => (
            <div key={index} className="history-item">
              <p><strong>{item.name}</strong></p>
              <p style={{ wordWrap: 'break-word' }}>{item.hash}</p>
              <p>{item.timestamp}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'royalties' && (
        <div className="royalties-section">
          <h3>My Royalties</h3>
          {purchaseHistory.length > 0 ? (
            purchaseHistory.map((item, index) => (
              <p key={index}>💰 Royalty from "{item.name}" on {item.timestamp}</p>
            ))
          ) : (
            <p>No royalties received yet.</p>
          )}
        </div>
      )}

      {tab === 'insights' && (
        <div className="insights-section">
          <h3>Insights</h3>
          <p>Total Uploads: {uploadHistory.length}</p>
          <p>Last Upload: {uploadHistory[0]?.timestamp || 'N/A'}</p>
        </div>
      )}

      {tab === 'buyer' && (
        <div className="buyer-section">
          <h3>Buyer View</h3>

          {!is2FAVerified && (
            <div className="twofa-box">
              <p><strong>Scan this QR Code with Google Authenticator:</strong></p>
              {otpauthUrl ? (
                <QRCodeCanvas value={otpauthUrl} size={180} includeMargin />
              ) : (
                <p>Generating QR…</p>
              )}

              {/* OPTIONAL: Debug current code (remove before submitting)
              <p style={{opacity:.6, marginTop:6}}>Debug code: {debugCode}</p>
              */}

              <p>Enter token from your app:</p>
              <input
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
              />
              <button onClick={verifyToken}>Verify</button>

              <button className="small-btn" onClick={reset2FA} style={{ marginLeft: 8 }}>
                Reset QR
              </button>
            </div>
          )}

          {is2FAVerified && (
            <>
              <p><strong>Upload a file to verify authenticity:</strong></p>
              <input type="file" onChange={handleFileChange} />

              <hr />

              <p><strong>Or verify from existing files:</strong></p>
              {uploadHistory.length === 0 ? (
                <p>No available files to purchase.</p>
              ) : (
                uploadHistory.map((item, index) => (
                  <div key={index} className="buyer-card">
                    <p><strong>{item.name}</strong></p>
                    <p style={{ wordWrap: 'break-word' }}>{item.hash}</p>
                    <p>{item.timestamp}</p>

                    {!verifiedHashes[item.hash] ? (
                      <button
                        className="simulate-btn"
                        onClick={() => handleVerify(item.hash)}
                      >
                        Verify Hash
                      </button>
                    ) : (
                      <>
                        <button
                          className="simulate-btn"
                          onClick={() => handlePurchase(item)}
                        >
                          Purchase
                        </button>
                        <p className="success">✅ Match found for "{item.name}"</p>
                        <button
                          className="small-btn"
                          onClick={handleDownloadCertificate}
                        >
                          Download Certificate
                        </button>
                      </>
                    )}
                  </div>
                ))
              )}
              {purchaseMsg && <p className="success">{purchaseMsg}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;


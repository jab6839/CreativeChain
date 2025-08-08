import React, { useEffect, useState } from 'react';

function TwoFactorSetup() {
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [verificationResult, setVerificationResult] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/generate-secret')
      .then(res => res.json())
      .then(data => {
        setQrCode(data.qrCode);
        setSecret(data.secret);
      });
  }, []);

  const handleVerify = async () => {
    const res = await fetch('http://localhost:5000/api/verify-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    const result = await res.json();
    setVerificationResult(result.valid ? '✅ Verified!' : '❌ Invalid code');
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '40px' }}>
      <h2>Set Up 2FA</h2>
      {qrCode && <img src={qrCode} alt="QR Code" style={{ width: '200px' }} />}
      <p>Secret: <code>{secret}</code></p>
      <input
        type="text"
        placeholder="Enter 6-digit code"
        value={token}
        onChange={e => setToken(e.target.value)}
      />
      <button onClick={handleVerify}>Verify</button>
      <p>{verificationResult}</p>
    </div>
  );
}

export default TwoFactorSetup;


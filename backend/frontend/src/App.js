import React, { useState } from 'react';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadHistory, setUploadHistory] = useState([]);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    const timestamp = new Date().toLocaleString();
    const newEntry = { name: selectedFile.name, time: timestamp };
    setUploadHistory([newEntry, ...uploadHistory]);

    // You can extend this with actual IPFS upload or smart contract interaction
    setSelectedFile(null);
  };

  return (
    <div className="App">
      <h1>🎨 CreativeChain</h1>
      <p>Protect your creative content with blockchain technology.</p>

      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload & Watermark</button>

      <h2>🕓 Upload History</h2>
      <ul>
        {uploadHistory.map((entry, index) => (
          <li key={index}>
            <strong>{entry.name}</strong> – uploaded on <em>{entry.time}</em>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;


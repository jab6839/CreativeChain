const express = require('express');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

let secret = speakeasy.generateSecret({ length: 20 });

app.get('/generate', async (req, res) => {
  const otpAuthUrl = speakeasy.otpauthURL({
    secret: secret.base32,
    label: 'CreativeChain',
    encoding: 'base32'
  });

  try {
    const qr = await qrcode.toDataURL(otpAuthUrl);
    res.json({ qr });
  } catch (err) {
    res.status(500).json({ error: 'QR generation failed' });
  }
});

app.post('/verify', (req, res) => {
  const { token } = req.body;

  const verified = speakeasy.totp.verify({
    secret: secret.base32,
    encoding: 'base32',
    token: token,
    window: 2
  });

  res.json({ verified });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ 2FA Server running at http://localhost:${PORT}`);
});


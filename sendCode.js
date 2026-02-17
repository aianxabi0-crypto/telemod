import MTProto from 'mtproto';

const apiId = parseInt(process.env.API_ID);
const apiHash = process.env.API_HASH;

const mtproto = new MTProto({
  api_id: apiId,
  api_hash: apiHash,
  test: false // production
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Phone required' });
  }

  try {
    // Send code via Telegram
    const result = await mtproto('auth.sendCode', {
      phone_number: phone,
      settings: {
        _: 'codeSettings'
      }
    });

    // Store phone_hash temporarily (we need it for verification)
    // In production, you'd store this in a session or DB. For simplicity, we'll return it to client (insecure)
    // Better: store in server memory with a short TTL (like using a Map). For Vercel, use a simple in-memory store (but may lose on cold start)
    // We'll attach phone_code_hash to response (client must send it back)
    res.status(200).json({ 
      success: true,
      phone_code_hash: result.phone_code_hash
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send code' });
  }
}

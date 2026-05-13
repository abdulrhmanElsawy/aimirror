import { useState } from 'react';
import api from '../../api/client';
import { imageUrl } from '../../utils/imageUrl';
import styles from './ResultScreen.module.css';

export default function ResultScreen({
  sessionId,
  imagePath,
  productName,
  category,
  generationSource,
  generationDetails,
  onTryAnother,
  onRetakePhoto,
}) {
  const [overlay, setOverlay] = useState(null);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [err, setErr] = useState('');

  const fullImageUrl = imageUrl(imagePath);

  const sendWa = async (e) => {
    e.preventDefault();
    setErr('');
    setStatus('sending');
    try {
      await api.post(`/api/tryon/${sessionId}/send-whatsapp`, {
        phoneNumber: phone,
      });
      setStatus('ok');
    } catch (er) {
      setStatus('err');
      setErr(er?.response?.data?.error || 'Failed to send');
    }
  };

  const sendEm = async (e) => {
    e.preventDefault();
    setErr('');
    setStatus('sending');
    try {
      await api.post(`/api/tryon/${sessionId}/send-email`, { email });
      setStatus('ok');
    } catch (er) {
      setStatus('err');
      setErr(er?.response?.data?.error || 'Failed to send');
    }
  };

  return (
    <div className={`pageEnter ${styles.root}`}>
      <div className={styles.grid}>
        <div className={styles.imgCol}>
          <img
            src={fullImageUrl}
            alt="Your generated look"
            className={styles.img}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className={styles.panel}>
          <h1 className={styles.title}>Your look</h1>
          <p className={styles.meta}>
            {productName}
            {category ? ` · ${category}` : ''}
          </p>
          <p className={styles.meta}>
            Source:{' '}
            {generationSource === 'vertex'
              ? 'Vertex AI'
              : generationSource === 'gemini'
                ? 'Gemini API'
                : 'Fallback/Test'}
          </p>
          {generationDetails ? <p className={styles.meta}>{generationDetails}</p> : null}
          <div className={styles.actions}>
            <a
              href={fullImageUrl}
              download
              className={`btnPrimary btnBlock ${styles.actionBtn}`}
            >
              Download image
            </a>
            <button
              type="button"
              className={`btnGhost btnBlock ${styles.actionBtn}`}
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: 'My look', url: fullImageUrl }).catch(() => {});
                } else {
                  window.open(fullImageUrl, '_blank', 'noopener,noreferrer');
                }
              }}
            >
              Share
            </button>
          </div>
          <button
            type="button"
            className={`btnPrimary btnBlock ${styles.actionBtn}`}
            onClick={() => {
              setOverlay('wa');
              setStatus('idle');
              setErr('');
            }}
          >
            Send via WhatsApp
          </button>
          <button
            type="button"
            className={`btnGhost btnBlock ${styles.actionBtn}`}
            onClick={() => {
              setOverlay('email');
              setStatus('idle');
              setErr('');
            }}
          >
            Send via email
          </button>
          <button type="button" className={styles.textLink} onClick={onTryAnother}>
            Try another look
          </button>
          <button type="button" className={styles.textLink} onClick={onRetakePhoto}>
            Retake photo
          </button>
        </div>
      </div>

      {overlay === 'wa' && (
        <div
          className={styles.modal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="wa-title"
        >
          <div className={styles.dialog}>
            <h2 id="wa-title" className={styles.dTitle}>
              Your WhatsApp number
            </h2>
            {status === 'ok' ? (
              <p className={styles.ok} role="status">
                Image sent to WhatsApp!
              </p>
            ) : (
              <form onSubmit={sendWa}>
                <label className={styles.lbl}>
                  Phone
                  <input
                    type="tel"
                    className={styles.inp}
                    placeholder="+20 XXXX XXXX"
                    pattern="[+0-9\\s-]{10,18}"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>
                {err && status === 'err' && (
                  <p className={styles.err} role="alert">
                    {err}
                  </p>
                )}
                <button type="submit" className={`btnPrimary btnBlock`} disabled={status === 'sending'}>
                  Send now
                </button>
              </form>
            )}
            <button type="button" className={styles.close} onClick={() => setOverlay(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      {overlay === 'email' && (
        <div
          className={styles.modal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="em-title"
        >
          <div className={styles.dialog}>
            <h2 id="em-title" className={styles.dTitle}>
              Your email
            </h2>
            {status === 'ok' ? (
              <p className={styles.ok} role="status">
                Email sent!
              </p>
            ) : (
              <form onSubmit={sendEm}>
                <label className={styles.lbl}>
                  Email
                  <input
                    type="email"
                    className={styles.inp}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                {err && status === 'err' && (
                  <p className={styles.err} role="alert">
                    {err}
                  </p>
                )}
                <button type="submit" className={`btnPrimary btnBlock`} disabled={status === 'sending'}>
                  Send to email
                </button>
              </form>
            )}
            <button type="button" className={styles.close} onClick={() => setOverlay(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef } from 'react';
import api from '../../api/client';
import styles from './ProcessingScreen.module.css';

export default function ProcessingScreen({
  sessionId,
  intent,
  onDone,
  onError,
}) {
  const doneRef = useRef(onDone);
  const errRef = useRef(onError);
  doneRef.current = onDone;
  errRef.current = onError;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (intent.type === 'manual') {
          const { data } = await api.post(
            `/api/tryon/${sessionId}/generate`,
            {
              productId: intent.productId,
              colorVariantIndex: intent.colorVariantIndex ?? 0,
              mode: 'manual',
            }
          );
          if (!cancelled) doneRef.current(data.imageUrl, data.source, data.details);
        } else {
          const { data } = await api.post(
            `/api/tryon/${sessionId}/auto-generate`,
            { eventType: intent.eventType }
          );
          if (!cancelled) {
            doneRef.current(
              data.imageUrl,
              data.source,
              data.details,
              data.suggestedProducts
            );
          }
        }
      } catch (e) {
        if (!cancelled) {
          errRef.current(
            e?.response?.data?.error || 'Generation failed. Please try again.'
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, intent]);

  return (
    <div className={`pageEnter ${styles.root}`}>
      <div className={styles.spinner} aria-hidden />
      <p className={styles.title}>Crafting your look…</p>
      <p className={styles.sub}>This usually takes 10–30 seconds</p>
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import api from './api/client';
import * as S from './constants/states';
import WelcomeScreen from './screens/WelcomeScreen/WelcomeScreen';
import ProductPickerScreen from './screens/ProductPickerScreen/ProductPickerScreen';
import CameraScreen from './screens/CameraScreen/CameraScreen';
import ProcessingScreen from './screens/ProcessingScreen/ProcessingScreen';
import ResultScreen from './screens/ResultScreen/ResultScreen';
import AutoPickScreen from './screens/AutoPickScreen/AutoPickScreen';

export default function App() {
  const [state, setState] = useState(S.STATE_WELCOME);
  const [sessionId, setSessionId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [eventType, setEventType] = useState('casual');
  const [generatedPath, setGeneratedPath] = useState('');
  const [generationSource, setGenerationSource] = useState('');
  const [generationDetails, setGenerationDetails] = useState('');
  const [flow, setFlow] = useState('manual');
  const [prefill, setPrefill] = useState('pending');

  const deleteSessionQuiet = useCallback(async (id) => {
    if (!id) return;
    try {
      await api.delete(`/api/tryon/${id}`);
    } catch {
      /* ignore */
    }
  }, []);

  const sessionRef = useRef(null);
  sessionRef.current = sessionId;
  useEffect(
    () => () => {
      if (sessionRef.current) deleteSessionQuiet(sessionRef.current);
    },
    [deleteSessionQuiet]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get('productId');
    if (!pid) {
      setPrefill('done');
      return;
    }
    api
      .get(`/api/products/${pid}`)
      .then((res) => {
        setSelectedProduct(res.data);
        setFlow('manual');
        setState(S.STATE_CAMERA);
      })
      .finally(() => setPrefill('done'));
  }, []);

  const hardReset = useCallback(async () => {
    await deleteSessionQuiet(sessionId);
    setSessionId(null);
    setSelectedProduct(null);
    setGeneratedPath('');
    setGenerationSource('');
    setGenerationDetails('');
    setState(S.STATE_WELCOME);
  }, [deleteSessionQuiet, sessionId]);

  if (prefill === 'pending') {
    return (
      <>
        <style>
          {`
            @keyframes aimirrorDot {
              0%, 80%, 100% { transform: scale(0.6); opacity: 0.35; }
              40% { transform: scale(1); opacity: 1; }
            }
            .aimirrorBootDots span {
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: #c8a96e;
              animation: aimirrorDot 1.2s ease-in-out infinite;
            }
            .aimirrorBootDots span:nth-child(2) { animation-delay: 0.15s; }
            .aimirrorBootDots span:nth-child(3) { animation-delay: 0.3s; }
          `}
        </style>
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#FAFAF8',
            fontFamily: "'DM Sans', system-ui, sans-serif",
            gap: '1.5rem',
          }}
        >
          <p
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '1.75rem',
              fontWeight: 300,
              letterSpacing: '0.06em',
              color: '#1A1A18',
            }}
          >
            AIMirror
          </p>
          <div className="aimirrorBootDots" style={{ display: 'flex', gap: '10px' }}>
            <span />
            <span />
            <span />
          </div>
        </div>
      </>
    );
  }

  if (state === S.STATE_WELCOME) {
    return (
      <WelcomeScreen
        onManual={() => {
          setFlow('manual');
          setState(S.STATE_MANUAL_PICK);
        }}
        onAuto={() => {
          setFlow('auto');
          setState(S.STATE_AUTO_PICK);
        }}
      />
    );
  }

  if (state === S.STATE_MANUAL_PICK) {
    return (
      <ProductPickerScreen
        onBack={hardReset}
        onNext={(p) => {
          setSelectedProduct(p);
          setState(S.STATE_CAMERA);
        }}
      />
    );
  }

  if (state === S.STATE_AUTO_PICK) {
    return (
      <AutoPickScreen
        onBack={hardReset}
        onNext={(et) => {
          setEventType(et);
          setState(S.STATE_CAMERA);
        }}
      />
    );
  }

  if (state === S.STATE_CAMERA) {
    return (
      <CameraScreen
        onBack={() => {
          if (flow === 'manual' && selectedProduct) {
            const params = new URLSearchParams(window.location.search);
            if (params.get('productId')) {
              hardReset();
              return;
            }
            setState(S.STATE_MANUAL_PICK);
            return;
          }
          if (flow === 'auto') {
            setState(S.STATE_AUTO_PICK);
            return;
          }
          hardReset();
        }}
        onSessionStarted={(sid) => {
          setSessionId(sid);
          setState(S.STATE_PROCESSING);
        }}
      />
    );
  }

  if (state === S.STATE_PROCESSING && sessionId) {
    const intent =
      flow === 'manual'
        ? {
            type: 'manual',
            productId: selectedProduct?._id,
            colorVariantIndex: 0,
          }
        : { type: 'auto', eventType };

    return (
      <ProcessingScreen
        sessionId={sessionId}
        intent={intent}
        onDone={(url, source, details) => {
          setGeneratedPath(url);
          setGenerationSource(source || '');
          setGenerationDetails(details || '');
          setState(S.STATE_RESULT);
        }}
        onError={() => {
          hardReset();
        }}
      />
    );
  }

  if (state === S.STATE_RESULT && sessionId && generatedPath) {
    return (
      <ResultScreen
        sessionId={sessionId}
        imagePath={generatedPath}
        productName={selectedProduct?.name || 'Suggested look'}
        category={selectedProduct?.category}
        generationSource={generationSource}
        generationDetails={generationDetails}
        onTryAnother={hardReset}
        onRetakePhoto={async () => {
          await deleteSessionQuiet(sessionId);
          setSessionId(null);
          setGeneratedPath('');
          setGenerationSource('');
          setGenerationDetails('');
          setState(S.STATE_CAMERA);
        }}
      />
    );
  }

  return null;
}

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../api/client';
import styles from './CameraScreen.module.css';

const COUNTDOWN_SECONDS = 3;
const POSE_CHECK_MS = 250;

function drawPoseGuide(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = 'rgba(200, 169, 110, 0.85)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  const cx = w / 2;
  const headR = Math.min(w, h) * 0.08;
  const cy = h * 0.28 + headR;

  ctx.beginPath();
  ctx.arc(cx, cy - headR * 2.2, headR, 0, Math.PI * 2);
  ctx.stroke();

  const neckY = cy - headR * 1.2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - headR * 1.2);
  ctx.lineTo(cx, cy + headR * 0.2);
  ctx.stroke();

  const shoulderY = cy + headR * 0.3;
  const shoulderW = headR * 2.2;
  ctx.beginPath();
  ctx.moveTo(cx - shoulderW, shoulderY);
  ctx.lineTo(cx + shoulderW, shoulderY);
  ctx.stroke();

  const torsoTop = shoulderY + 4;
  const torsoH = headR * 3;
  ctx.strokeRect(cx - shoulderW * 0.75, torsoTop, shoulderW * 1.5, torsoH);

  const armY = torsoTop + headR * 0.5;
  ctx.beginPath();
  ctx.moveTo(cx - shoulderW, shoulderY);
  ctx.lineTo(cx - shoulderW * 1.6, armY + headR * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + shoulderW, shoulderY);
  ctx.lineTo(cx + shoulderW * 1.6, armY + headR * 2);
  ctx.stroke();

  const hipY = torsoTop + torsoH;
  ctx.beginPath();
  ctx.moveTo(cx - shoulderW * 0.9, hipY);
  ctx.lineTo(cx + shoulderW * 0.9, hipY);
  ctx.stroke();

  const legBase = hipY + 6;
  ctx.beginPath();
  ctx.moveTo(cx - headR * 0.6, legBase);
  ctx.lineTo(cx - headR * 0.5, h * 0.88);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + headR * 0.6, legBase);
  ctx.lineTo(cx + headR * 0.5, h * 0.88);
  ctx.stroke();

  ctx.restore();
}

function getGuideBounds(w, h) {
  const cx = w / 2;
  const headR = Math.min(w, h) * 0.08;
  const cy = h * 0.28 + headR;
  const shoulderW = headR * 2.2;
  return {
    left: cx - shoulderW * 1.8,
    right: cx + shoulderW * 1.8,
    top: cy - headR * 3.3,
    bottom: h * 0.9,
    centerX: cx,
  };
}

function pointFromKeypoints(keypoints, name, minScore = 0.25) {
  const kp = keypoints.find((k) => k.name === name && (k.score ?? 0) >= minScore);
  if (!kp) return null;
  return { x: kp.x, y: kp.y };
}

function isBodyInsideGuide(pose, w, h) {
  if (!pose?.keypoints?.length) return false;
  const pts = [
    pointFromKeypoints(pose.keypoints, 'nose'),
    pointFromKeypoints(pose.keypoints, 'left_shoulder'),
    pointFromKeypoints(pose.keypoints, 'right_shoulder'),
    pointFromKeypoints(pose.keypoints, 'left_hip'),
    pointFromKeypoints(pose.keypoints, 'right_hip'),
    pointFromKeypoints(pose.keypoints, 'left_ankle'),
    pointFromKeypoints(pose.keypoints, 'right_ankle'),
  ];
  if (pts.some((p) => !p)) return false;

  const valid = pts.filter(Boolean);
  const minX = Math.min(...valid.map((p) => p.x));
  const maxX = Math.max(...valid.map((p) => p.x));
  const minY = Math.min(...valid.map((p) => p.y));
  const maxY = Math.max(...valid.map((p) => p.y));

  const guide = getGuideBounds(w, h);
  const marginX = Math.max(16, (guide.right - guide.left) * 0.05);
  const marginY = Math.max(16, (guide.bottom - guide.top) * 0.04);
  const bodyCenterX = (minX + maxX) / 2;
  const centerTolerance = (guide.right - guide.left) * 0.14;

  return (
    minX >= guide.left - marginX &&
    maxX <= guide.right + marginX &&
    minY >= guide.top - marginY &&
    maxY <= guide.bottom + marginY &&
    Math.abs(bodyCenterX - guide.centerX) <= centerTolerance
  );
}

export default function CameraScreen({ onBack, onSessionStarted }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const [denied, setDenied] = useState(false);
  const [noCam, setNoCam] = useState(false);
  const [busy, setBusy] = useState(false);
  const [isAligned, setIsAligned] = useState(false);
  const [countdown, setCountdown] = useState(null);

  const clearCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(null);
  }, []);

  const capture = useCallback(async () => {
    const video = videoRef.current;
    if (!video?.videoWidth || busy) return;
    setBusy(true);
    clearCountdown();
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      const blob = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9)
      );
      const fd = new FormData();
      fd.append('photo', blob, 'capture.jpg');
      const { data } = await api.post('/api/tryon/start', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      streamRef.current?.getTracks().forEach((t) => t.stop());
      onSessionStarted(data.sessionId);
    } catch {
      setBusy(false);
    }
  }, [busy, clearCountdown, onSessionStarted]);

  const captureRef = useRef(capture);
  captureRef.current = capture;

  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (stop) return;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (e) {
        if (e.name === 'NotAllowedError') setDenied(true);
        else if (e.name === 'NotFoundError') setNoCam(true);
        else setDenied(true);
      }
    })();
    return () => {
      stop = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    try {
      if ('PoseDetector' in window) {
        const detector = new window.PoseDetector({
          modelType: 'full',
          maxPoses: 1,
        });
        if (mounted) detectorRef.current = detector;
      } else {
        detectorRef.current = null;
      }
    } catch {
      detectorRef.current = null;
    }
    return () => {
      mounted = false;
      if (detectorRef.current?.dispose) detectorRef.current.dispose();
      detectorRef.current = null;
    };
  }, []);

  useEffect(() => {
    let raf;
    const loop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.videoWidth) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        const ctx = canvas.getContext('2d');
        drawPoseGuide(ctx, canvas.width, canvas.height);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    let timer = null;
    let cancelled = false;
    timer = setInterval(async () => {
      if (cancelled || busy) return;
      const detector = detectorRef.current;
      const video = videoRef.current;
      if (!detector || !video?.videoWidth || video.readyState < 2) return;
      try {
        const poses = await detector.estimatePoses(video);
        const inside = isBodyInsideGuide(poses?.[0], video.videoWidth, video.videoHeight);
        setIsAligned(inside);
      } catch {
        setIsAligned(false);
      }
    }, POSE_CHECK_MS);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [busy]);

  useEffect(() => {
    if (busy) {
      clearCountdown();
      return;
    }
    if (!isAligned) {
      clearCountdown();
      return;
    }
    if (countdownIntervalRef.current || countdown != null) return;

    setCountdown(COUNTDOWN_SECONDS);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev == null) return prev;
        if (prev <= 1) {
          clearCountdown();
          captureRef.current();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [busy, clearCountdown, countdown, isAligned]);

  useEffect(() => () => clearCountdown(), [clearCountdown]);

  if (denied || noCam) {
    return (
      <div className={styles.fallback}>
        <p className={styles.msg} role="alert">
          {noCam ? 'No camera found' : 'Camera permission required'}
        </p>
        <button type="button" className={styles.back} onClick={onBack}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <button type="button" className={styles.topBack} onClick={onBack} aria-label="Back">
        ← Back
      </button>
      <div className={styles.videoWrap}>
        <video ref={videoRef} className={styles.video} playsInline muted />
        <canvas ref={canvasRef} className={styles.overlay} />
        <div className={styles.statusWrap}>
          <p className={styles.status}>
            {busy
              ? 'Capturing...'
              : countdown != null
                ? `Hold still... ${countdown}`
                : isAligned
                  ? 'Perfect! Hold still for auto-capture.'
                  : 'Stand fully inside the body guide.'}
          </p>
        </div>
      </div>
      <div className={styles.bar}>
        <button
          type="button"
          className={styles.capture}
          onClick={capture}
          disabled={busy}
          aria-label="Capture photo"
        >
          <span className={styles.captureInner} />
        </button>
      </div>
    </div>
  );
}

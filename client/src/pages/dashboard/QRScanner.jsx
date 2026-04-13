import { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import { useValidateTicketMutation } from '../../features/tickets/ticketsApi';
import {
  QrCodeIcon,
  CameraIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  StopIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// ── Result display configs ──────────────────────────────────────────────────
const RESULT_CONFIG = {
  valid: {
    icon:      CheckCircleIcon,
    bg:        'bg-emerald-500/15 border-emerald-500/50',
    iconColor: 'text-emerald-400',
    badge:     'bg-emerald-500',
    title:     '✅ Access Granted',
  },
  already_used: {
    icon:      XCircleIcon,
    bg:        'bg-red-500/15 border-red-500/50',
    iconColor: 'text-red-400',
    badge:     'bg-red-500',
    title:     '🚫 Already Used',
  },
  expired: {
    icon:      ExclamationTriangleIcon,
    bg:        'bg-amber-500/15 border-amber-500/50',
    iconColor: 'text-amber-400',
    badge:     'bg-amber-500',
    title:     '⏰ Ticket Expired',
  },
  invalid: {
    icon:      XCircleIcon,
    bg:        'bg-red-500/15 border-red-500/50',
    iconColor: 'text-red-400',
    badge:     'bg-red-500',
    title:     '❌ Invalid QR Code',
  },
  unpaid: {
    icon:      ExclamationTriangleIcon,
    bg:        'bg-amber-500/15 border-amber-500/50',
    iconColor: 'text-amber-400',
    badge:     'bg-amber-500',
    title:     '💳 Payment Incomplete',
  },
  error: {
    icon:      ExclamationTriangleIcon,
    bg:        'bg-slate-500/15 border-slate-500/50',
    iconColor: 'text-slate-400',
    badge:     'bg-slate-500',
    title:     '⚠️ Scan Error',
  },
};

export default function QRScanner() {
  const [validateTicket] = useValidateTicketMutation();

  // Camera state
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);
  const rafRef     = useRef(null);

  const [cameraActive,  setCameraActive]  = useState(false);
  const [cameraError,   setCameraError]   = useState(null);
  const [scanning,      setScanning]      = useState(false);

  // Validation state
  const [validating,    setValidating]    = useState(false);
  const [result,        setResult]        = useState(null);
  const [manualToken,   setManualToken]   = useState('');
  const [scanCount,     setScanCount]     = useState(0);

  // ── Camera helpers ─────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
    setScanning(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setScanning(true);
    } catch (err) {
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera access denied. Please allow camera permission in your browser settings.'
          : `Camera error: ${err.message}`
      );
    }
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // ── QR validation via RTK mutation ────────────────────────────────────────
  const handleValidation = useCallback(async (token) => {
    if (!token?.trim() || validating) return;
    setValidating(true);
    setScanning(false);

    try {
      const json = await validateTicket({ qrToken: token.trim() }).unwrap();

      // unwrap gives us the raw ApiResponse envelope {statusCode, data, message}
      const resultKey = json.data?.result ?? (
        json.statusCode === 200 ? 'valid' :
        json.statusCode === 409 ? 'already_used' :
        json.message?.toLowerCase().includes('expired') ? 'expired' :
        json.message?.toLowerCase().includes('unpaid')  ? 'unpaid'  :
        'invalid'
      );

      setResult({ resultKey, message: json.message, data: json.data });
      setScanCount((c) => c + 1);

      if (resultKey === 'valid')        toast.success('Entry granted!',          { icon: '✅' });
      else if (resultKey === 'already_used') toast.error('Ticket already used!', { icon: '🚫' });
      else                              toast.error(json.message || 'Invalid ticket');

    } catch (err) {
      // RTK throws on non-2xx; check err.data for the ApiResponse body
      const errBody = err?.data;
      const resultKey = errBody?.data?.result ?? (
        err?.status === 409 ? 'already_used' :
        errBody?.message?.toLowerCase().includes('expired') ? 'expired' :
        errBody?.message?.toLowerCase().includes('unpaid')  ? 'unpaid'  :
        'invalid'
      );
      setResult({ resultKey, message: errBody?.message || err?.message || 'Validation error', data: errBody?.data });
      setScanCount((c) => c + 1);
      toast.error(errBody?.message || 'Scan failed');
    } finally {
      setValidating(false);
    }
  }, [validateTicket, validating]);


  // Scan loop — reads video frames and looks for QR
  const tick = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code?.data) {
      handleValidation(code.data);
      return; // don't schedule next frame — wait for validation result
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [handleValidation]);

  useEffect(() => {
    if (scanning && cameraActive) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [scanning, cameraActive, tick]);

  const resumeScanning = () => {
    setResult(null);
    setManualToken('');
    setScanning(true);
  };

  // ── Render result card ─────────────────────────────────────────────────────
  const renderResult = () => {
    if (!result) return null;
    const cfg  = RESULT_CONFIG[result.resultKey] ?? RESULT_CONFIG.error;
    const Icon = cfg.icon;
    const d    = result.data ?? {};

    return (
      <div className={`rounded-2xl border p-5 mt-4 animate-fade-in ${cfg.bg}`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.badge}/20`}>
            <Icon className={`w-6 h-6 ${cfg.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-white text-lg">{cfg.title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full text-white font-medium ${cfg.badge}`}>
                {result.resultKey.toUpperCase().replace('_', ' ')}
              </span>
            </div>
            <p className="text-slate-300 text-sm mb-3">{result.message}</p>

            {result.resultKey === 'valid' && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                {d.holderName  && <Row label="Name"      value={d.holderName}  />}
                {d.holderEmail && <Row label="Email"     value={d.holderEmail} />}
                {d.tierName    && <Row label="Tier"      value={d.tierName}    />}
                {d.eventName   && <Row label="Event"     value={d.eventName}   />}
                {d.bookingRef  && <Row label="Booking #" value={d.bookingRef}   />}
                {d.usedAt      && <Row label="Entry at"  value={new Date(d.usedAt).toLocaleTimeString('en-IN')} />}
              </div>
            )}

            {result.resultKey === 'already_used' && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                {d.holderName && <Row label="Name"     value={d.holderName} />}
                {d.usedAt    && <Row label="Used at"  value={new Date(d.usedAt).toLocaleString('en-IN')} />}
                {d.scanCount && <Row label="Scan #"   value={d.scanCount}  />}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={resumeScanning}
          className="mt-4 w-full btn-md btn-primary"
        >
          📷 Scan Next Ticket
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="page-title flex items-center gap-2">
          <QrCodeIcon className="w-7 h-7 text-primary-400" />
          QR Ticket Scanner
        </h1>
        <p className="page-subtitle">
          Scan attendee QR codes at the venue entrance gate
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass p-4 text-center">
          <p className="text-2xl font-bold text-white">{scanCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">Total Scanned</p>
        </div>
        <div className={`glass p-4 text-center ${cameraActive ? 'border-emerald-500/40' : ''}`}>
          <p className={`text-2xl font-bold ${cameraActive ? 'text-emerald-400' : 'text-slate-500'}`}>
            {cameraActive ? (validating ? '⏳' : scanning ? '🔍' : '⏸') : '⭕'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {cameraActive ? (validating ? 'Processing…' : scanning ? 'Scanning…' : 'Paused') : 'Camera Off'}
          </p>
        </div>
      </div>

      {/* Camera panel */}
      <div className="glass overflow-hidden">
        {/* Camera view */}
        <div className="relative bg-black aspect-video flex items-center justify-center">
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
            playsInline
            muted
          />

          {/* Scanning overlay */}
          {cameraActive && scanning && !validating && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-56 h-56">
                {/* corner brackets */}
                <div className="absolute top-0 left-0  w-8 h-8 border-t-4 border-l-4 border-primary-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0  w-8 h-8 border-b-4 border-l-4 border-primary-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary-400 rounded-br-lg" />
                {/* scan line */}
                <div className="absolute top-0 left-4 right-4 h-0.5 bg-primary-400 animate-scan-line" />
              </div>
              <p className="absolute bottom-4 text-white/70 text-xs bg-black/40 px-3 py-1 rounded-full">
                Align QR code within the frame
              </p>
            </div>
          )}

          {validating && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="text-center">
                <div className="w-10 h-10 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-white text-sm">Validating ticket…</p>
              </div>
            </div>
          )}

          {!cameraActive && !cameraError && (
            <div className="text-center py-16">
              <CameraIcon className="w-16 h-16 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Camera is off</p>
            </div>
          )}

          {cameraError && (
            <div className="text-center px-6 py-10">
              <ExclamationTriangleIcon className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <p className="text-amber-400 font-medium mb-2">Camera Unavailable</p>
              <p className="text-slate-400 text-sm">{cameraError}</p>
            </div>
          )}
        </div>

        {/* Canvas (hidden — used for frame processing only) */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Camera controls */}
        <div className="p-4 flex gap-3">
          {!cameraActive ? (
            <button onClick={startCamera} className="flex-1 btn-md btn-primary gap-2">
              <CameraIcon className="w-4 h-4" />
              Start Camera
            </button>
          ) : (
            <>
              <button
                onClick={() => setScanning((s) => !s)}
                disabled={validating}
                className="flex-1 btn-md btn-secondary gap-2"
              >
                {scanning
                  ? <><StopIcon className="w-4 h-4" /> Pause</>
                  : <><QrCodeIcon className="w-4 h-4" /> Resume</>}
              </button>
              <button onClick={stopCamera} className="btn-md btn-secondary text-red-400 hover:text-red-300">
                Stop Camera
              </button>
            </>
          )}
        </div>
      </div>

      {/* Result card */}
      {result && renderResult()}

      {/* Manual input fallback */}
      <div className="glass p-5">
        <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
          <QrCodeIcon className="w-4 h-4 text-primary-400" />
          Manual Token Entry
        </h3>
        <p className="text-slate-400 text-xs mb-3">
          Paste a QR token manually for testing or when camera is unavailable.
        </p>
        <div className="flex gap-2">
          <textarea
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder="Paste JWT QR token here…"
            rows={3}
            className="input flex-1 resize-none font-mono text-xs"
          />
          <button
            onClick={() => handleValidation(manualToken)}
            disabled={!manualToken.trim() || validating}
            className="btn-md btn-primary self-end"
          >
            {validating ? '…' : 'Validate'}
          </button>
        </div>
      </div>

      {/* Scan line animation keyframes injected via style tag */}
      <style>{`
        @keyframes scan-line {
          0%   { top: 0; opacity: 1; }
          50%  { top: calc(100% - 2px); opacity: 0.6; }
          100% { top: 0; opacity: 1; }
        }
        .animate-scan-line { animation: scan-line 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

// ── Small helper subcomponent ──────────────────────────────────────────────
function Row({ label, value }) {
  return (
    <div className="glass-sm px-3 py-2 rounded-lg">
      <p className="text-slate-400 text-xs">{label}</p>
      <p className="text-white font-medium truncate">{value}</p>
    </div>
  );
}

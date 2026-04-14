import { useState, useRef, useEffect, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
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

  // Scanner state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError]   = useState(null);
  const [scanning, setScanning]         = useState(false);
  const scannerRef                      = useRef(null);

  // Validation state
  const [validating, setValidating] = useState(false);
  const [result, setResult]         = useState(null);
  const [manualToken, setManualToken] = useState('');
  const [scanCount, setScanCount]   = useState(0);

  // ── QR validation handler ────────────────────────────────────────────────
  const handleValidation = useCallback(async (token) => {
    if (!token?.trim() || validating) return;
    
    // Stop scanning immediately to prevent duplicate scans
    const scanner = scannerRef.current;
    if (scanner && scanner.isScanning) {
        try {
            await scanner.pause(true);
            setScanning(false);
        } catch (err) {
            console.error('Failed to pause scanner:', err);
        }
    }

    setValidating(true);
    try {
      const json = await validateTicket({ qrToken: token.trim() }).unwrap();

      const resultKey = json.data?.result ?? (
        json.statusCode === 200 ? 'valid' :
        json.statusCode === 409 ? 'already_used' :
        json.message?.toLowerCase().includes('expired') ? 'expired' :
        json.message?.toLowerCase().includes('unpaid')  ? 'unpaid'  :
        'invalid'
      );

      setResult({ resultKey, message: json.message, data: json.data });
      setScanCount((c) => c + 1);

      if (resultKey === 'valid') toast.success('Entry granted!', { icon: '✅' });
      else if (resultKey === 'already_used') toast.error('Ticket already used!', { icon: '🚫' });
      else toast.error(json.message || 'Invalid ticket');

    } catch (err) {
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

  // ── Scanner Lifecycle ────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setResult(null);
    
    try {
      const scanner = new Html5Qrcode("reader");
      scannerRef.current = scanner;

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await scanner.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          handleValidation(decodedText);
        },
        (errorMessage) => {
          // silent error for frame-swiping
        }
      );

      setCameraActive(true);
      setScanning(true);
    } catch (err) {
      setCameraError(`Camera error: ${err.message || 'Access denied'}`);
      setCameraActive(false);
    }
  }, [handleValidation]);

  const stopCamera = useCallback(async () => {
    const scanner = scannerRef.current;
    if (scanner) {
      try {
        if (scanner.isScanning) {
            await scanner.stop();
        }
        scannerRef.current = null;
      } catch (err) {
        console.error('Failed to stop scanner:', err);
      }
    }
    setCameraActive(false);
    setScanning(false);
  }, []);

  const resumeScanning = async () => {
    setResult(null);
    setManualToken('');
    const scanner = scannerRef.current;
    if (scanner) {
        try {
            scanner.resume();
            setScanning(true);
        } catch (err) {
            console.error('Failed to resume scanner:', err);
            // Fallback: restart
            await stopCamera();
            await startCamera();
        }
    }
  };

  useEffect(() => {
    return () => {
        if (scannerRef.current?.isScanning) {
            scannerRef.current.stop().catch(console.error);
        }
    };
  }, []);

  // ── Render Helpers ────────────────────────────────────────────────────────
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
      <div className="glass overflow-hidden relative">
        <div id="reader" className={`${cameraActive ? 'block' : 'hidden'} w-full border-0`} />
        
        {!cameraActive && !cameraError && (
          <div className="text-center py-20 bg-black/20">
            <CameraIcon className="w-16 h-16 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Camera is off</p>
          </div>
        )}

        {cameraError && (
          <div className="text-center px-6 py-14 bg-black/20">
            <ExclamationTriangleIcon className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <p className="text-amber-400 font-medium mb-2">Scanner Failure</p>
            <p className="text-slate-400 text-sm">{cameraError}</p>
          </div>
        )}

        {validating && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-white text-sm">Validating ticket…</p>
            </div>
          </div>
        )}

        {/* Camera controls */}
        <div className="p-4 flex gap-3 bg-surface-dark border-t border-surface-border">
          {!cameraActive ? (
            <button onClick={startCamera} className="flex-1 btn-md btn-primary gap-2">
              <CameraIcon className="w-4 h-4" />
              Start Scanner
            </button>
          ) : (
            <>
              <button onClick={stopCamera} className="flex-1 btn-md btn-secondary text-red-400 hover:text-red-300 gap-2">
                <StopIcon className="w-4 h-4" />
                Stop Scanner
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

      <style>{`
        #reader video {
            width: 100% !important;
            border-radius: 0 !important;
            object-fit: cover !important;
        }
        #reader__dashboard_section_csr button {
            display: none !important;
        }
        #reader__scan_region {
            background: #000 !important;
        }
        #reader__scan_region > div {
            border: 0 !important;
        }
      `}</style>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="glass-sm px-3 py-2 rounded-lg">
      <p className="text-slate-400 text-xs">{label}</p>
      <p className="text-white font-medium truncate">
        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
      </p>
    </div>
  );
}

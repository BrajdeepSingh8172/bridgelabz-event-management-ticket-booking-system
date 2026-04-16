import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { formatDate } from '../../utils/formatDate';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

/**
 * QRModal — displays the real JWT-signed QR code image from IssuedTicket.
 * Falls back to a styled placeholder if no issuedTicket yet (booking still pending).
 */
export default function QRModal({ isOpen, onClose, booking }) {
  // The real QR comes from the IssuedTicket attached to the booking by the API
  const issuedTicket = booking?.issuedTicket;
  const qrImage      = issuedTicket?.qrImage || booking?.qrCode || null; // base64 PNG

  const downloadQR = () => {
    if (!qrImage) return;
    const a      = document.createElement('a');
    a.href       = qrImage; // data:image/png;base64,...
    a.download   = `ticket-${issuedTicket?.ticketCode ?? booking?.bookingRef ?? 'qr'}.png`;
    a.click();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Your Entry QR Code" size="sm">
      <div className="flex flex-col items-center gap-5">

        {/* Ticket code + status */}
        <div className="text-center">
          <p className="font-mono text-primary-300 font-bold tracking-widest text-lg">
            {issuedTicket?.ticketCode ?? booking?.bookingRef ?? '—'}
          </p>
          <p className="text-slate-400 text-sm mt-0.5">{booking?.event?.title}</p>
          {booking?.event?.startDate && (
            <p className="text-slate-500 text-xs mt-0.5">{formatDate(booking.event.startDate)}</p>
          )}
        </div>

        {/* QR Image */}
        {qrImage ? (
          <div className="p-4 bg-white rounded-2xl shadow-card">
            <img
              src={qrImage}
              alt="Entry QR Code"
              className="w-[200px] h-[200px] object-contain"
            />
          </div>
        ) : (
          <div className="w-[220px] h-[220px] glass border-dashed border-2 border-surface-border rounded-2xl flex flex-col items-center justify-center gap-2 text-center p-4">
            <XCircleIcon className="w-8 h-8 text-slate-500" />
            <p className="text-slate-400 text-sm">QR code not yet available</p>
            <p className="text-slate-500 text-xs">
              {booking?.status === 'pending'
                ? 'Complete payment to receive your QR code.'
                : 'QR generation may still be in progress. Check back shortly.'}
            </p>
          </div>
        )}

        {/* Tier + usage status */}
        {issuedTicket && (
          <div className="w-full flex items-center justify-between px-1 text-sm">
            <span className="text-slate-400">
              Tier: <span className="text-white font-medium">{issuedTicket.tierName ?? 'General'}</span>
            </span>
            {issuedTicket.isUsed ? (
              <span className="flex items-center gap-1 text-amber-400 text-xs font-medium">
                <XCircleIcon className="w-4 h-4" />
                Used {issuedTicket.usedAt ? `· ${formatDate(issuedTicket.usedAt)}` : ''}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                <CheckCircleIcon className="w-4 h-4" />
                Valid — not yet scanned
              </span>
            )}
          </div>
        )}

        {/* Warning */}
        {qrImage && (
          <p className="text-xs text-red-400 font-semibold text-center">
            ⚠️ Valid for ONE entry only. Do not share this QR code.
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 w-full">
          {qrImage && (
            <Button onClick={downloadQR} variant="secondary" className="w-full">
              ⬇ Download QR as PNG
            </Button>
          )}
          <Button onClick={onClose} variant="ghost" className="w-full">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

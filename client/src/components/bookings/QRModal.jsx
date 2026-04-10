import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { formatDate } from '../../utils/formatDate';

export default function QRModal({ isOpen, onClose, booking }) {
  const svgRef = useRef(null);

  const qrValue = JSON.stringify({
    bookingId:  booking?._id,
    ref:        booking?.bookingRef,
    event:      booking?.event?.title,
    attendee:   booking?.attendeeName,
  });

  const downloadQR = () => {
    const svg    = svgRef.current?.querySelector('svg');
    if (!svg) return;
    const data   = new XMLSerializer().serializeToString(svg);
    const blob   = new Blob([data], { type: 'image/svg+xml' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a');
    a.href       = url;
    a.download   = `ticket-${booking?.bookingRef ?? 'qr'}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Your Ticket QR Code" size="sm">
      <div className="flex flex-col items-center gap-5">
        <div
          ref={svgRef}
          className="p-4 bg-white rounded-2xl shadow-card"
        >
          <QRCodeSVG value={qrValue} size={200} level="H" />
        </div>

        <div className="text-center">
          <p className="font-mono text-primary-300 font-semibold tracking-widest text-lg">
            {booking?.bookingRef}
          </p>
          <p className="text-slate-400 text-sm mt-1">{booking?.event?.title}</p>
          {booking?.event?.startDate && (
            <p className="text-slate-500 text-xs">{formatDate(booking.event.startDate)}</p>
          )}
        </div>

        <Button onClick={downloadQR} variant="secondary" className="w-full">
          ⬇ Download QR
        </Button>
      </div>
    </Modal>
  );
}

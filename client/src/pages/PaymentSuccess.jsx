import { useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useGetBookingByIdQuery } from '../features/bookings/bookingsApi';
import { QRCodeSVG } from 'qrcode.react';
import Spinner from '../components/ui/Spinner';
import Button  from '../components/ui/Button';
import { formatDateTime } from '../utils/formatDate';
import { formatCurrency }  from '../utils/formatCurrency';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

export default function PaymentSuccess() {
  const { state }   = useLocation();
  const bookingId   = state?.bookingId;
  const svgRef      = useRef(null);

  const { data: booking, isLoading } = useGetBookingByIdQuery(bookingId, { skip: !bookingId });

  const qrValue = JSON.stringify({
    bookingId:  booking?._id,
    ref:        booking?.bookingRef,
    event:      booking?.event?.title,
    attendee:   booking?.attendeeName,
  });

  const downloadQR = () => {
    const svg  = svgRef.current?.querySelector('svg');
    if (!svg)  return;
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `ticket-${booking?.bookingRef ?? 'qr'}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!bookingId) {
    return (
      <div className="container-app py-20 text-center">
        <p className="text-slate-400 mb-4">No booking information found.</p>
        <Link to="/events" className="btn-md btn-primary">Browse Events</Link>
      </div>
    );
  }

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="container-app py-16 max-w-lg text-center">
      {/* Success badge */}
      <div className="flex flex-col items-center gap-4 mb-8 animate-slide-up">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
          <CheckCircleIcon className="w-9 h-9 text-emerald-400" />
        </div>
        <div>
          <h1 className="font-display font-bold text-3xl text-white">Booking Confirmed!</h1>
          <p className="text-slate-400 mt-2">Your ticket is ready. Show the QR code at the venue.</p>
        </div>
      </div>

      {/* Booking info */}
      {booking && (
        <div className="glass p-6 mb-6 text-left space-y-3 animate-fade-in">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Event</span>
            <span className="text-white font-medium">{booking.event?.title}</span>
          </div>
          {booking.event?.startDate && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Date</span>
              <span className="text-white">{formatDateTime(booking.event.startDate)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Booking Ref</span>
            <span className="font-mono text-primary-300 font-semibold">{booking.bookingRef}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Amount Paid</span>
            <span className="text-emerald-400 font-semibold">{formatCurrency(booking.totalAmount)}</span>
          </div>
        </div>
      )}

      {/* QR Code */}
      <div ref={svgRef} className="inline-block p-4 bg-white rounded-2xl shadow-card mb-6">
        <QRCodeSVG value={qrValue} size={200} level="H" />
      </div>

      <div className="flex flex-col gap-3">
        <Button onClick={downloadQR} variant="secondary" size="lg" className="w-full">
          ⬇ Download QR Ticket
        </Button>
        <Link to="/events" className="btn-lg btn-ghost w-full">
          Browse More Events
        </Link>
      </div>
    </div>
  );
}

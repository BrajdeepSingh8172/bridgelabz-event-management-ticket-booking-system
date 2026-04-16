import { useState } from 'react';
import { canCancelBooking, getRefundAmount } from '../../utils/cancellationPolicy';
import { XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function CancelModal({ booking, onClose, onConfirm, isLoading }) {
  const [reason, setReason] = useState('');

  const policy     = canCancelBooking(booking?.event?.startDate, booking?.status);
  const refundInfo = policy.canCancel
    ? getRefundAmount(booking?.totalAmount ?? 0, policy.hoursUntilEvent)
    : null;

  if (!policy.canCancel) return null; // safety guard — modal should only open when allowed

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-700 shadow-2xl animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white">Request Cancellation</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/5 text-slate-400 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Booking info */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 text-sm space-y-1">
          <p className="text-white font-medium truncate">{booking?.event?.title}</p>
          <p className="text-slate-400">Booking Ref: <span className="font-mono text-primary-300">{booking?.bookingRef}</span></p>
          <p className="text-slate-400">Amount Paid: <span className="text-white font-medium">₹{booking?.totalAmount}</span></p>
        </div>

        {/* Refund policy table */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mb-4">
          <h3 className="text-blue-400 font-semibold mb-3 text-sm">Refund Policy</h3>
          <div className="space-y-1.5 text-xs text-gray-300">
            <div className="flex justify-between">
              <span>More than 7 days before event</span>
              <span className="text-emerald-400 font-semibold">100% refund</span>
            </div>
            <div className="flex justify-between">
              <span>3–7 days before event</span>
              <span className="text-amber-400 font-semibold">75% refund</span>
            </div>
            <div className="flex justify-between">
              <span>48–72 hours before event</span>
              <span className="text-orange-400 font-semibold">50% refund</span>
            </div>
            <div className="flex justify-between">
              <span>Less than 48 hours</span>
              <span className="text-red-400 font-semibold">No cancellation</span>
            </div>
          </div>
        </div>

        {/* Eligible refund */}
        <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 text-sm font-semibold">Your Eligible Refund</span>
          </div>
          <p className="text-emerald-300 font-bold text-xl">
            ₹{refundInfo?.refund?.toFixed(2)} ({refundInfo?.percent}%)
          </p>
          <p className="text-gray-400 text-xs mt-1">
            {refundInfo?.label} · Credited within 7 business days after admin approval
          </p>
          <p className="text-yellow-400/80 text-xs mt-1.5">
            ⚠️ Refund is processed after admin reviews your request (within 24 hrs)
          </p>
        </div>

        {/* Reason */}
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for cancellation (optional)"
          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm mb-4 resize-none h-24 placeholder-slate-500 focus:outline-none focus:border-primary-500/50 transition-colors"
        />

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 border border-gray-600 text-gray-300 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium disabled:opacity-50"
          >
            Keep Booking
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={isLoading}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Submitting…' : 'Confirm Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

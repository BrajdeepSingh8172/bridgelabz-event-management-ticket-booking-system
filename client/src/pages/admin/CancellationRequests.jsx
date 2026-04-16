import { useState } from 'react';
import {
  useGetPendingCancellationsQuery,
  useAdminCancellationDecisionMutation,
} from '../../features/bookings/bookingsApi';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyRupeeIcon,
  CalendarDaysIcon,
  UserCircleIcon,
  TicketIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

function RejectModal({ booking, onClose, onConfirm, isLoading }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-red-500/30 shadow-2xl">
        <div className="flex items-center gap-2 mb-4">
          <XCircleIcon className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-bold text-white">Reject Cancellation</h3>
        </div>
        <p className="text-slate-400 text-sm mb-4">
          Rejecting cancellation for <span className="text-white font-medium">{booking?.event?.title}</span> —{' '}
          <span className="text-primary-300">{booking?.user?.name}</span>.
          Booking will remain confirmed.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter rejection reason (shown to user in email)"
          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm mb-4 resize-none h-24 placeholder-slate-500 focus:outline-none focus:border-red-500/50 transition-colors"
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 border border-gray-600 text-gray-300 rounded-xl hover:bg-white/5 transition-colors text-sm"
          >
            Go Back
          </button>
          <button
            onClick={() => onConfirm(reason || 'Request reviewed and denied by admin')}
            disabled={isLoading}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors text-sm disabled:opacity-50"
          >
            {isLoading ? 'Rejecting…' : 'Reject Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RefundBadge({ percent }) {
  const color =
    percent === 100 ? 'text-emerald-400 bg-emerald-900/30 border-emerald-500/30' :
    percent === 75  ? 'text-amber-400  bg-amber-900/30  border-amber-500/30'  :
                     'text-orange-400 bg-orange-900/30 border-orange-500/30';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${color}`}>
      {percent}% refund
    </span>
  );
}

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function CancellationRequests() {
  const { data: requests, isLoading, error, refetch } = useGetPendingCancellationsQuery();
  const [makeDecision, { isLoading: deciding }] = useAdminCancellationDecisionMutation();

  const [rejectTarget, setRejectTarget] = useState(null);
  const [approvingId, setApprovingId]   = useState(null);

  const handleApprove = async (booking) => {
    setApprovingId(booking._id);
    try {
      await makeDecision({ bookingId: booking._id, decision: 'approve' }).unwrap();
      toast.success(`✅ Approved! Refund of ₹${booking.refundAmount} initiated for ${booking.user?.name}`);
    } catch (err) {
      toast.error(err?.data?.message ?? 'Failed to approve cancellation');
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectConfirm = async (reason) => {
    if (!rejectTarget) return;
    try {
      await makeDecision({ bookingId: rejectTarget._id, decision: 'reject', reason }).unwrap();
      toast.success(`Cancellation request rejected for ${rejectTarget.user?.name}`);
      setRejectTarget(null);
    } catch (err) {
      toast.error(err?.data?.message ?? 'Failed to reject cancellation');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Cancellation Requests</h1>
          <p className="page-subtitle mt-1">Review and approve or reject user cancellation requests</p>
        </div>
        <div className="flex items-center gap-3">
          {requests?.length > 0 && (
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-500 text-white text-xs font-bold">
              {requests.length}
            </span>
          )}
          <button
            onClick={refetch}
            className="btn-sm btn-secondary text-xs"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Refund Policy Reference */}
      <div className="glass p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <CurrencyRupeeIcon className="w-4 h-4 text-primary-400" />
          Refund Policy Reference
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {[
            { label: '> 7 days before', refund: '100%', color: 'text-emerald-400' },
            { label: '3–7 days before', refund: '75%',  color: 'text-amber-400'   },
            { label: '48–72 hrs before', refund: '50%', color: 'text-orange-400'  },
            { label: '< 48 hrs before', refund: 'None', color: 'text-red-400'     },
          ].map(({ label, refund, color }) => (
            <div key={label} className="glass-sm p-3 rounded-xl text-center">
              <p className={`font-bold text-base ${color}`}>{refund}</p>
              <p className="text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="glass p-6 text-center">
          <ExclamationTriangleIcon className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-400">Failed to load cancellation requests.</p>
          <button onClick={refetch} className="btn-sm btn-secondary mt-3">Retry</button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && requests?.length === 0 && (
        <div className="glass p-16 text-center">
          <CheckCircleIcon className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="font-display font-semibold text-lg text-white mb-1">All Clear!</h3>
          <p className="text-slate-400">No pending cancellation requests at this time.</p>
        </div>
      )}

      {/* Request Cards */}
      {!isLoading && requests?.map((req) => (
        <div
          key={req._id}
          className="glass p-5 border border-amber-500/20 hover:border-amber-500/40 transition-all"
        >
          <div className="flex flex-col lg:flex-row gap-5">
            {/* Left: booking info */}
            <div className="flex-1 space-y-3">
              {/* User & Event */}
              <div className="flex items-start gap-3 flex-wrap">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {req.user?.name?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-white">{req.user?.name}</p>
                    <RefundBadge percent={req.refundPercent} />
                  </div>
                  <p className="text-xs text-slate-400">{req.user?.email}</p>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <CalendarDaysIcon className="w-4 h-4 text-primary-400 flex-shrink-0" />
                  <span className="truncate">{req.event?.title}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <TicketIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="font-mono text-primary-300 text-xs">{req.bookingRef}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <CurrencyRupeeIcon className="w-4 h-4 text-white flex-shrink-0" />
                  <span>
                    Paid: <span className="text-white font-medium">₹{req.totalAmount}</span>
                    &nbsp;→ Refund:{' '}
                    <span className="text-emerald-400 font-bold">₹{req.refundAmount}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <ClockIcon className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Requested {timeAgo(req.cancellationRequestedAt)}</span>
                </div>
              </div>

              {/* Reason */}
              {req.cancellationReason && req.cancellationReason !== 'No reason provided' && (
                <div className="bg-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-300 border border-white/5">
                  <span className="text-slate-500 text-xs">Reason: </span>
                  {req.cancellationReason}
                </div>
              )}
            </div>

            {/* Right: actions */}
            <div className="flex lg:flex-col gap-3 lg:justify-center lg:min-w-[160px]">
              <button
                onClick={() => handleApprove(req)}
                disabled={deciding || approvingId === req._id}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircleIcon className="w-4 h-4" />
                {approvingId === req._id ? 'Approving…' : 'Approve & Refund'}
              </button>
              <button
                onClick={() => setRejectTarget(req)}
                disabled={deciding || approvingId === req._id}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-red-500 text-red-400 hover:bg-red-500 hover:text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircleIcon className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Reject Modal */}
      {rejectTarget && (
        <RejectModal
          booking={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleRejectConfirm}
          isLoading={deciding}
        />
      )}
    </div>
  );
}

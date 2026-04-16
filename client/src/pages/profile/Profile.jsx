import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema } from '../../utils/validators';
import { useAuth } from '../../hooks/useAuth';
import {
  useGetUserBookingsQuery,
  useRequestCancellationMutation,
  useCancelBookingMutation,
} from '../../features/bookings/bookingsApi';
import axiosClient from '../../api/axiosClient';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../features/auth/authSlice';
import BookingCard from '../../components/bookings/BookingCard';
import CancelModal from '../../components/bookings/CancelModal';
import QRModal     from '../../components/bookings/QRModal';
import Input   from '../../components/ui/Input';
import Button  from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import toast   from 'react-hot-toast';
import { TicketIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function Profile() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [saving, setSaving]             = useState(false);
  const [selectedBk, setSelectedBk]    = useState(null); // QR modal
  const [cancelTarget, setCancelTarget] = useState(null); // Cancel modal (confirmed bookings)

  // ── Data fetching ──────────────────────────────────────────────────────────
  const {
    data: bookingsData,
    isLoading: bkLoading,
    isError: bkError,
    error: bkErrorDetail,
    refetch,
  } = useGetUserBookingsQuery(undefined, {
    refetchOnMountOrArgChange: true, // always refetch when profile mounts
  });

  const [requestCancellation, { isLoading: cancelling }] = useRequestCancellationMutation();
  const [cancelBooking] = useCancelBookingMutation();

  // Handle both array and { bookings: [] } response shapes
  const bookings = Array.isArray(bookingsData)
    ? bookingsData
    : bookingsData?.bookings ?? [];

  // ── Profile form ───────────────────────────────────────────────────────────
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', phone: user?.phone ?? '', bio: user?.bio ?? '' },
  });

  const onSave = async (values) => {
    setSaving(true);
    try {
      const { data } = await axiosClient.patch('/api/users/profile', values);
      const raw = data?.data ?? data?.user ?? data;
      const updatedUser = {
        id:     raw._id ?? raw.id,
        name:   raw.name,
        email:  raw.email,
        role:   raw.role,
        avatar: raw.avatar ?? null,
      };
      dispatch(setCredentials({ user: updatedUser }));
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  // ── Direct cancel (pending bookings — payment not taken) ───────────────────
  const handleDirectCancel = async (bookingId) => {
    try {
      await cancelBooking(bookingId).unwrap();
      toast.success('Booking cancelled successfully.');
    } catch (err) {
      toast.error(err?.data?.message ?? 'Failed to cancel booking.');
    }
  };

  // ── Request cancellation (confirmed bookings — goes to admin) ──────────────
  const handleConfirmCancel = async (reason) => {
    if (!cancelTarget) return;
    try {
      await requestCancellation({
        bookingId: cancelTarget._id,
        cancellationReason: reason,
      }).unwrap();
      toast.success('Cancellation request submitted! Admin will review within 24 hours.');
      setCancelTarget(null);
    } catch (err) {
      toast.error(err?.data?.message ?? 'Failed to submit cancellation request.');
    }
  };

  return (
    <div className="container-app py-10 max-w-4xl">
      <h1 className="page-title mb-8">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Profile form ────────────────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="glass p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-2xl font-bold text-white mb-3 shadow-glow">
                {user?.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <p className="font-semibold text-white">{user?.name}</p>
              <p className="text-sm text-slate-400">{user?.email}</p>
              <span className="mt-2 badge badge-primary capitalize">{user?.role ?? 'user'}</span>
            </div>

            <form onSubmit={handleSubmit(onSave)} className="space-y-4" noValidate>
              <Input id="prof-name"  label="Name"  type="text" error={errors.name?.message}  {...register('name')} />
              <Input id="prof-phone" label="Phone" type="tel"  placeholder="10 digits" error={errors.phone?.message} {...register('phone')} />
              <div>
                <label className="label">Bio</label>
                <textarea
                  id="prof-bio"
                  rows={3}
                  placeholder="Tell us about yourself…"
                  className="input resize-none"
                  {...register('bio')}
                />
                {errors.bio && <p className="error-msg">{errors.bio.message}</p>}
              </div>
              <Button type="submit" loading={saving} className="w-full btn-md btn-primary">
                Save Changes
              </Button>
            </form>
          </div>
        </div>

        {/* ── Bookings section ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white text-lg">My Bookings</h2>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
            >
              <ArrowPathIcon className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          {/* Loading */}
          {bkLoading && (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          )}

          {/* Error state */}
          {!bkLoading && bkError && (
            <div className="glass p-8 text-center border border-red-500/20">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <p className="text-red-400 font-medium mb-1">Failed to load bookings</p>
              <p className="text-slate-500 text-sm mb-4">
                {bkErrorDetail?.data?.message ?? bkErrorDetail?.error ?? 'Please try again'}
              </p>
              <button
                onClick={() => refetch()}
                className="btn-sm btn-secondary"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty state */}
          {!bkLoading && !bkError && bookings.length === 0 && (
            <div className="glass p-12 text-center">
              <TicketIcon className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-white font-medium mb-1">No bookings yet</p>
              <p className="text-slate-400 text-sm">
                Browse events and book your first ticket!
              </p>
            </div>
          )}

          {/* Booking cards */}
          {!bkLoading && !bkError && bookings.length > 0 && (
            <div className="space-y-4">
              {bookings.map((bk) => (
                <BookingCard
                  key={bk._id}
                  booking={bk}
                  onDirectCancel={handleDirectCancel}
                  onRequestCancel={setCancelTarget}
                  onViewQr={setSelectedBk}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QR Modal */}
      <QRModal
        isOpen={!!selectedBk}
        onClose={() => setSelectedBk(null)}
        booking={selectedBk}
      />

      {/* Cancel Modal (for confirmed bookings — admin flow) */}
      {cancelTarget && (
        <CancelModal
          booking={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onConfirm={handleConfirmCancel}
          isLoading={cancelling}
        />
      )}
    </div>
  );
}

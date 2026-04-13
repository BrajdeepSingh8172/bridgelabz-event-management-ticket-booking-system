import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema } from '../../utils/validators';
import { useAuth } from '../../hooks/useAuth';
import { useGetUserBookingsQuery, useCancelBookingMutation } from '../../features/bookings/bookingsApi';
import axiosClient from '../../api/axiosClient';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../features/auth/authSlice';
import BookingCard from '../../components/bookings/BookingCard';
import QRModal     from '../../components/bookings/QRModal';
import Input   from '../../components/ui/Input';
import Button  from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import toast   from 'react-hot-toast';

export default function Profile() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [saving, setSaving]       = useState(false);
  const [selectedBk, setSelectedBk] = useState(null);

  const { data: bookingsData, isLoading: bkLoading } = useGetUserBookingsQuery();
  const [cancelBooking] = useCancelBookingMutation();
  const bookings = Array.isArray(bookingsData) ? bookingsData : bookingsData?.bookings ?? [];

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', phone: user?.phone ?? '', bio: user?.bio ?? '' },
  });

  const onSave = async (values) => {
    setSaving(true);
    try {
      const { data } = await axiosClient.patch('/api/users/profile', values);
      // axiosClient returns raw axios response; data is ApiResponse { success, data: <user>, message }
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

  const handleCancel = async (id) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await cancelBooking(id).unwrap();
      toast.success('Booking cancelled.');
    } catch {
      toast.error('Failed to cancel booking.');
    }
  };

  return (
    <div className="container-app py-10 max-w-4xl">
      <h1 className="page-title mb-8">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile form */}
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
              <Button type="submit" loading={saving} className="w-full btn-md btn-primary">Save Changes</Button>
            </form>
          </div>
        </div>

        {/* Bookings */}
        <div className="lg:col-span-2">
          <h2 className="font-semibold text-white text-lg mb-4">My Bookings</h2>
          {bkLoading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : bookings.length === 0 ? (
            <div className="glass p-10 text-center">
              <p className="text-slate-400">No bookings yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((bk) => (
                <BookingCard
                  key={bk._id}
                  booking={bk}
                  onCancel={handleCancel}
                  onViewQr={setSelectedBk}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <QRModal
        isOpen={!!selectedBk}
        onClose={() => setSelectedBk(null)}
        booking={selectedBk}
      />
    </div>
  );
}

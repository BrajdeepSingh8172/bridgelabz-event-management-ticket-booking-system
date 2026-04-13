import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { eventSchema } from '../../utils/validators';
import { useGetEventByIdQuery, useUpdateEventMutation } from '../../features/events/eventsApi';
import Input  from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import toast  from 'react-hot-toast';

const CATEGORIES = ['Conference', 'Concert', 'Festival', 'Sports', 'Workshop', 'Networking', 'Exhibition', 'Other'];

export default function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: event, isLoading: fetching } = useGetEventByIdQuery(id);
  const [updateEvent, { isLoading: updating }] = useUpdateEventMutation();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(eventSchema),
  });

  useEffect(() => {
    if (event) {
      // slice date to match datetime-local format (YYYY-MM-DDTHH:mm)
      const fmDate = (d) => d ? new Date(d).toISOString().slice(0, 16) : '';
      reset({
        title:         event.title,
        venue:         event.venue?.name ?? event.venue ?? '',  // venue is an object
        city:          event.venue?.city ?? '',                  // city is nested in venue
        startDate:     fmDate(event.startDate),
        endDate:       fmDate(event.endDate),
        category:      event.category,
        totalCapacity: event.totalCapacity,
        description:   event.description,
        isFeatured:    event.isFeatured,
      });
    }
  }, [event, reset]);

  const onSubmit = async (values) => {
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        if (v !== undefined && v !== '') formData.append(k, v);
      });
      const banner = values._bannerFile?.[0];
      if (banner) formData.append('banner', banner);

      await updateEvent({ id, formData }).unwrap();
      toast.success('Event updated!');
      navigate('/dashboard/events');
    } catch (err) {
      toast.error(err?.data?.message ?? 'Failed to update event.');
    }
  };

  if (fetching) return <div className="flex justify-center py-10"><Spinner /></div>;

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <h1 className="page-title">Edit Event</h1>
        <p className="page-subtitle">Update details for {event?.title}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="glass p-6 space-y-5" noValidate>
        <Input id="evt-title" label="Event Title" required error={errors.title?.message} {...register('title')} />
        <Input id="evt-venue" label="Venue" required error={errors.venue?.message} {...register('venue')} />
        <Input id="evt-city"  label="City"  required error={errors.city?.message} {...register('city')} />
        <Input id="evt-start" label="Start Date" type="datetime-local" required error={errors.startDate?.message} {...register('startDate')} />
        <Input id="evt-end"   label="End Date"   type="datetime-local" error={errors.endDate?.message} {...register('endDate')} />

        <div>
          <label className="label">Category <span className="text-red-400">*</span></label>
          <select id="evt-category" className={`input ${errors.category ? 'input-error' : ''}`} {...register('category')}>
            <option value="">Select category</option>
            {CATEGORIES.map((c) => <option key={c} value={c.toLowerCase()}>{c}</option>)}
          </select>
          {errors.category && <p className="error-msg">{errors.category.message}</p>}
        </div>

        <Input id="evt-capacity" label="Total Capacity" type="number" min="1" required placeholder="e.g. 500" error={errors.totalCapacity?.message} {...register('totalCapacity')} />

        <div>
          <label className="label">Description <span className="text-red-400">*</span></label>
          <textarea id="evt-desc" rows={4} className={`input resize-none ${errors.description ? 'input-error' : ''}`} {...register('description')} />
          {errors.description && <p className="error-msg">{errors.description.message}</p>}
        </div>

        <div>
          <label className="label">Update Banner Image</label>
          <input id="evt-banner" type="file" accept="image/*" className="input py-2 text-slate-400 cursor-pointer" {...register('_bannerFile')} />
          {event?.bannerImage && (
            <p className="text-xs text-slate-400 mt-2">Current banner will be kept if no new file is selected.</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <input id="evt-featured" type="checkbox" className="w-4 h-4 accent-primary-500" {...register('isFeatured')} />
          <label htmlFor="evt-featured" className="text-sm text-slate-300">Mark as featured event</label>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={updating} className="btn-md btn-primary">Save Changes</Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/dashboard/events')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

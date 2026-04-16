import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { eventSchema } from '../../utils/validators';
import { useCreateEventMutation } from '../../features/events/eventsApi';
import Input  from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast  from 'react-hot-toast';

const CATEGORIES = ['Conference', 'Concert', 'Festival', 'Sports', 'Workshop', 'Networking', 'Exhibition', 'Other'];

export default function CreateEvent() {
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);
  const [createEvent, { isLoading }] = useCreateEventMutation();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: { isFeatured: false },
  });

  const onSubmit = async (values) => {
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        // Skip internal/file fields — handled separately below
        if (k.startsWith('_')) return;
        if (v === undefined || v === '') return;
        // Booleans must be sent as 'true'/'false' strings correctly
        formData.append(k, typeof v === 'boolean' ? String(v) : v);
      });
      // Append actual file (if selected) under the field name multer expects
      const banner = values._bannerFile?.[0];
      if (banner) formData.append('bannerImage', banner);

      console.log('📦 FormData entries:', [...formData.entries()].map(([k,v]) => `${k}: ${v instanceof File ? v.name : v}`));
      const result = await createEvent(formData).unwrap();
      toast.success('Event created! 🎉');
      // result is the event object directly (transformResponse already unwrapped ApiResponse.data)
      const eventId = result?._id ?? result?.id;
      navigate(eventId
        ? `/dashboard/events/${eventId}/tickets`
        : '/dashboard/events'
      );
    } catch (err) {
      toast.error(err?.data?.message ?? 'Failed to create event.');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <h1 className="page-title">Create Event</h1>
        <p className="page-subtitle">Fill in the details for your new event</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="glass p-6 space-y-5" noValidate>
        <Input id="ev-title"       label="Event Title"   required placeholder="Amazing Concert 2025" error={errors.title?.message}       {...register('title')} />
        <Input id="ev-venue"       label="Venue"         required placeholder="Convention Centre"    error={errors.venue?.message}       {...register('venue')} />
        <Input id="ev-city"        label="City"          required placeholder="Mumbai"               error={errors.city?.message}        {...register('city')} />
        <Input id="ev-start"       label="Start Date"    required type="datetime-local"              error={errors.startDate?.message}   {...register('startDate')} />
        <Input id="ev-end"         label="End Date"               type="datetime-local"              error={errors.endDate?.message}     {...register('endDate')} />

        <div>
          <label className="label">Category <span className="text-red-400">*</span></label>
          <select id="ev-category" className={`input ${errors.category ? 'input-error' : ''}`} {...register('category')}>
            <option value="">Select category</option>
            {CATEGORIES.map((c) => <option key={c} value={c.toLowerCase()}>{c}</option>)}
          </select>
          {errors.category && <p className="error-msg">{errors.category.message}</p>}
        </div>

        <Input id="ev-capacity" label="Total Capacity" type="number" min="1" required placeholder="e.g. 500" error={errors.totalCapacity?.message} {...register('totalCapacity')} />

        <div>
          <label className="label">Description <span className="text-red-400">*</span></label>
          <textarea id="ev-desc" rows={4} placeholder="Describe your event…" className={`input resize-none ${errors.description ? 'input-error' : ''}`} {...register('description')} />
          {errors.description && <p className="error-msg">{errors.description.message}</p>}
        </div>

        <div>
          <label className="label">Banner Image</label>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {preview && (
              <div className="w-32 h-20 rounded-xl overflow-hidden bg-surface-border flex-shrink-0 border border-primary-500/30">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 w-full">
              <input 
                id="ev-banner" 
                type="file" 
                accept="image/*" 
                className="input py-2 text-slate-400 cursor-pointer" 
                {...register('_bannerFile', {
                  onChange: (e) => {
                    const file = e.target.files?.[0];
                    if (file) setPreview(URL.createObjectURL(file));
                  }
                })} 
              />
              <p className="text-[10px] text-slate-500 mt-1">Recommend 1280x720. Max size 5MB.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input id="ev-featured" type="checkbox" className="w-4 h-4 accent-primary-500" {...register('isFeatured')} />
          <label htmlFor="ev-featured" className="text-sm text-slate-300">Mark as featured event</label>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={isLoading} className="btn-md btn-primary">Create Event</Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/dashboard/events')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

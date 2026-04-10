import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutSchema } from '../utils/validators';
import { useCreateOrderMutation, useVerifyPaymentMutation } from '../features/payments/paymentsApi';
import { useGetEventByIdQuery } from '../features/events/eventsApi';
import { useAuth } from '../hooks/useAuth';
import Input  from '../components/ui/Input';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { formatCurrency } from '../utils/formatCurrency';
import toast from 'react-hot-toast';

export default function Checkout() {
  const { eventId }  = useParams();
  const { state }    = useLocation();
  const navigate     = useNavigate();
  const { user }     = useAuth();
  const selections   = state?.selections ?? {};

  const { data: event, isLoading } = useGetEventByIdQuery(eventId);
  const [createOrder,  { isLoading: ordering  }] = useCreateOrderMutation();
  const [verifyPayment, { isLoading: verifying }] = useVerifyPaymentMutation();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      attendeeName:  user?.name  ?? '',
      attendeeEmail: user?.email ?? '',
      attendeePhone: '',
    },
  });

  const tickets = event?.ticketTypes ?? [];
  const lineItems = tickets
    .filter((t) => (selections[t._id] ?? 0) > 0)
    .map((t) => ({ ...t, qty: selections[t._id] }));
  const total = lineItems.reduce((s, t) => s + t.price * t.qty, 0);

  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const s  = document.createElement('script');
      s.src    = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  const onSubmit = async (formValues) => {
    if (lineItems.length === 0) {
      toast.error('Please select at least one ticket.');
      return;
    }
    try {
      const loaded = await loadRazorpay();
      if (!loaded) { toast.error('Payment gateway unavailable.'); return; }

      const orderData = await createOrder({
        eventId,
        tickets: lineItems.map((t) => ({ ticketTypeId: t._id, quantity: t.qty })),
        attendee: formValues,
      }).unwrap();

      const options = {
        key:          import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount:       orderData.amount,
        currency:     orderData.currency ?? 'INR',
        name:         'EventHub',
        description:  event?.title,
        order_id:     orderData.orderId,
        prefill: {
          name:  formValues.attendeeName,
          email: formValues.attendeeEmail,
          contact: formValues.attendeePhone,
        },
        theme: { color: '#6366f1' },
        handler: async (response) => {
          try {
            const result = await verifyPayment({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              bookingId:           orderData.bookingId,
            }).unwrap();
            toast.success('Payment successful! 🎉');
            navigate('/payment-success', { state: { bookingId: result.bookingId ?? orderData.bookingId }, replace: true });
          } catch {
            toast.error('Payment verification failed.');
          }
        },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      toast.error(err?.data?.message ?? 'Could not initiate payment.');
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="container-app py-10 max-w-4xl">
      <h1 className="page-title mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-3 space-y-5" noValidate>
          <div className="glass p-6 space-y-4">
            <h2 className="font-semibold text-white">Attendee Details</h2>
            <Input id="att-name"  label="Full Name"  type="text"  required placeholder="Your full name"  error={errors.attendeeName?.message}  {...register('attendeeName')} />
            <Input id="att-email" label="Email"      type="email" required placeholder="you@example.com" error={errors.attendeeEmail?.message} {...register('attendeeEmail')} />
            <Input id="att-phone" label="Phone"      type="tel"   required placeholder="10-digit number"  error={errors.attendeePhone?.message} {...register('attendeePhone')} />
          </div>

          <Button
            type="submit"
            loading={ordering || verifying}
            className="w-full btn-lg btn-primary"
            disabled={lineItems.length === 0}
          >
            {total === 0 ? 'Confirm Free Booking' : `Pay ${formatCurrency(total)}`}
          </Button>
        </form>

        {/* Summary */}
        <div className="lg:col-span-2">
          <div className="glass p-5 sticky top-20 space-y-4">
            <h2 className="font-semibold text-white">Order Summary</h2>
            <p className="text-sm text-primary-300 font-medium">{event?.title}</p>

            {lineItems.length === 0 ? (
              <p className="text-slate-400 text-sm">No tickets selected.</p>
            ) : (
              <div className="space-y-2">
                {lineItems.map((t) => (
                  <div key={t._id} className="flex justify-between text-sm">
                    <span className="text-slate-300">{t.name} × {t.qty}</span>
                    <span className="text-white font-medium">{formatCurrency(t.price * t.qty)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-surface-border pt-3 flex justify-between">
              <span className="text-slate-400">Total</span>
              <span className="font-display font-bold text-primary-300 text-lg">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

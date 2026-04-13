import { useEffect } from 'react';
import { useForm }   from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '../../utils/validators';
import { useRegisterMutation } from '../../features/auth/authApi';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../features/auth/authSlice';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Input  from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast  from 'react-hot-toast';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

export default function Register() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { isAuth } = useAuth();
  const [registerApi, { isLoading }] = useRegisterMutation();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    if (isAuth) navigate('/', { replace: true });
  }, [isAuth, navigate]);

  const onSubmit = async (values) => {
    try {
      const data = await registerApi(values).unwrap();
      // data is now { user, accessToken } (ApiResponse.data unwrapped)
      const rawUser = data.user ?? data;
      const user = {
        id:     rawUser._id ?? rawUser.id,
        name:   rawUser.name,
        email:  rawUser.email,
        role:   rawUser.role,
        avatar: rawUser.avatar ?? null,
      };
      dispatch(setCredentials({ accessToken: data.accessToken, user }));
      toast.success('Account created! Welcome to EventHub 🎉');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err?.data?.message || 'Registration failed. Please try again.');
    }
  };

  const googleUrl = `${import.meta.env.VITE_API_URL}/api/auth/google`;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-hero-glow bg-surface">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shadow-glow">
            <CalendarDaysIcon className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-display font-bold text-2xl gradient-text">Create your account</h1>
          <p className="text-slate-400 text-sm">Join thousands of event creators & attendees</p>
        </div>

        <div className="glass p-8 space-y-5">
          <a
            href={googleUrl}
            id="google-register-btn"
            className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl border border-surface-border hover:border-primary-500/50 hover:bg-white/5 transition-all text-sm font-medium text-slate-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M5.27 9.76A7.08 7.08 0 0 1 12 4.9c1.84 0 3.5.67 4.79 1.76L20.16 3.3A11.95 11.95 0 0 0 12 .5C8.15.5 4.8 2.63 2.96 5.76l2.31 4z" />
              <path fill="#34A853" d="M16.04 18.01A7.06 7.06 0 0 1 12 19.1a7.08 7.08 0 0 1-6.72-4.82L3 18.25A11.94 11.94 0 0 0 12 23.5c3.18 0 6.05-1.17 8.22-3.1l-4.18-2.39z" />
              <path fill="#FBBC05" d="M19.1 12c0-.65-.07-1.29-.18-1.9H12v3.6h3.96a3.38 3.38 0 0 1-1.47 2.22l4.18 2.39C20.35 16.63 21.1 14.44 19.1 12z" />
              <path fill="#4285F4" d="M5.28 14.28A7.1 7.1 0 0 1 4.9 12c0-.79.14-1.55.38-2.24L3 5.76A11.9 11.9 0 0 0 .5 12c0 1.93.46 3.75 1.27 5.36l3.51-3.08z" />
            </svg>
            Sign up with Google
          </a>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-surface-border" />
            <span className="text-xs text-slate-500">or</span>
            <div className="flex-1 h-px bg-surface-border" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input id="reg-name"     label="Full Name"  type="text"     placeholder="John Doe"         required error={errors.name?.message}            {...register('name')} />
            <Input id="reg-email"    label="Email"      type="email"    placeholder="you@example.com"  required error={errors.email?.message}           {...register('email')} />
            <Input id="reg-password" label="Password"   type="password" placeholder="Min 8 chars + digit" required error={errors.password?.message}     {...register('password')} />
            <Input id="reg-confirm"  label="Confirm Password" type="password" placeholder="Re-enter password" required error={errors.confirmPassword?.message} {...register('confirmPassword')} />

            <Button type="submit" loading={isLoading} className="w-full btn-lg btn-primary">
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

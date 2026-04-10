import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCredentials } from '../../features/auth/authSlice';
import axiosClient from '../../api/axiosClient';
import { FullPageSpinner } from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();

  useEffect(() => {
    const init = async () => {
      const params = new URLSearchParams(window.location.search);
      const token  = params.get('token');

      if (!token) {
        toast.error('Google authentication failed.');
        navigate('/login?error=auth_failed', { replace: true });
        return;
      }

      // 1. Store token immediately so axiosClient can use it
      dispatch(setCredentials({ accessToken: token }));

      try {
        // 2. Fetch user profile
        const { data } = await axiosClient.get('/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        // 3. Store user
        const userData = data.data ?? data.user ?? data;
        dispatch(setCredentials({ user: userData }));
        toast.success(`Welcome back, ${userData?.name || 'User'}!`);
        navigate('/', { replace: true });
      } catch (err) {
        console.error('[AuthCallback] get profile failed:', err);
        // Clear the bad token so isAuth becomes false
        dispatch(setCredentials({ accessToken: null, user: null }));
        toast.error('Could not load user profile. Try again.');
        navigate('/login?error=auth_failed', { replace: true });
      }
    };

    init();
  }, [dispatch, navigate]);

  return <FullPageSpinner />;
}

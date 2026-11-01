import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';
import { supabase } from '../services/supabase';

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const finishSignIn = async () => {
      if (!supabase) {
        setError('Supabase authentication is not configured.');
        return;
      }
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!data.session) throw new Error('No authenticated session was returned.');
      await api.get('/auth/profile');
      if (active) navigate('/app/dashboard', { replace: true });
    };

    void finishSignIn().catch((reason: unknown) => {
      if (active) {
        setError(reason instanceof Error ? reason.message : 'Unable to complete sign-in.');
      }
    });

    return () => { active = false; };
  }, [navigate]);

  if (!error) return <LoadingSpinner message="Completing secure sign-in..." size="lg" />;
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-800">
      <p className="font-semibold">Sign-in could not be completed.</p>
      <p className="mt-1 text-xs">{error}</p>
      <Link to="/login" className="mt-3 inline-block text-xs font-semibold underline">Return to sign in</Link>
    </div>
  );
};

export default AuthCallbackPage;

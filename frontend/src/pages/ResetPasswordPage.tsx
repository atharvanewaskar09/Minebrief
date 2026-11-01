import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { requireSupabase } from '../services/supabase';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setSaving(true);
      const { error: updateError } = await requireSupabase().auth.updateUser({ password });
      if (updateError) throw updateError;
      navigate('/app/dashboard', { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-navy-900">Set a new password</h2>
        <p className="mt-1 text-xs text-slate-500">Choose a new password for your MineBrief account.</p>
      </div>
      {error && <p className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-800" role="alert">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-xs font-semibold text-slate-700">
          New password
          <input required type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <label className="block text-xs font-semibold text-slate-700">
          Confirm new password
          <input required type="password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <button type="submit" disabled={saving} className="w-full rounded bg-forest-800 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60">
          {saving ? 'Updating...' : 'Update password'}
        </button>
      </form>
      <div className="mt-5 text-center text-xs">
        <Link to="/login" className="font-semibold text-forest-700">Back to sign in</Link>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

import React, { useState } from 'react';
import { Lock, Key, Eye, EyeOff, Building } from 'lucide-react';
import { useBankState } from '../hooks/use-bank-state';
import { Button } from '@/components/ui/button';

export function SetupScreen({ setupAccount }: { setupAccount: (pwd: string) => Promise<void> }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    await setupAccount(password);
    setLoading(false);
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[420px] flex flex-col items-center">
        <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary border border-primary/20 shadow-[0_0_30px_rgba(0,200,150,0.15)]">
          <Building className="w-8 h-8" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Randy Alejandro Bank</h1>
        <p className="text-muted-foreground text-center mb-10 text-sm">Create your password to get started</p>
        
        <div className="w-full bg-card rounded-2xl p-6 border border-card-border shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-10 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-10 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-destructive text-sm text-center font-medium animate-in fade-in slide-in-from-top-1">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl py-3 mt-4 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Setting up...' : 'Create password & enter'}
            </button>
          </form>
          
          <p className="text-xs text-muted-foreground text-center mt-6 leading-relaxed">
            Your password is stored on this device for 30 days. After that you'll need to create a new one.
          </p>
        </div>
      </div>
    </div>
  );
}

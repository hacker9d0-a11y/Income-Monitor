import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Building } from 'lucide-react';

export function LoginScreen({ login }: { login: (pwd: string) => Promise<boolean> }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    const success = await login(password);
    setLoading(false);

    if (!success) {
      setError('Incorrect password');
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-[420px] flex flex-col items-center relative z-10">
        <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary border border-primary/20 shadow-[0_0_30px_rgba(0,200,150,0.15)]">
          <Building className="w-8 h-8" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Randy Alejandro Bank</h1>
        <p className="text-muted-foreground text-center mb-10 text-sm">Enter your password to continue</p>
        
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

            {error && (
              <p className="text-destructive text-sm text-center font-medium animate-in fade-in slide-in-from-top-1">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl py-3 mt-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Enter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

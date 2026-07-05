import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { useBankState } from './hooks/use-bank-state';
import { SetupScreen } from './pages/setup';
import { LoginScreen } from './pages/login';
import { DashboardScreen } from './pages/dashboard';
import NotFound from '@/pages/not-found';
import { Loader2 } from 'lucide-react';

const queryClient = new QueryClient();

function BankAppShell() {
  const { 
    authState, 
    startTime, 
    hourlyRate, 
    setupAccount, 
    login, 
    logout,
  } = useBankState();

  if (authState === 'loading') {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (authState === 'setup') {
    return <SetupScreen setupAccount={setupAccount} />;
  }

  if (authState === 'login') {
    return <LoginScreen login={login} />;
  }

  if (authState === 'dashboard') {
    return (
      <DashboardScreen 
        startTime={startTime} 
        hourlyRate={hourlyRate} 
        logout={logout}
      />
    );
  }

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={BankAppShell} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, '') || ''}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

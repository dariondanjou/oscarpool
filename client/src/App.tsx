import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/NotFound';
import { Route, Switch } from 'wouter';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';
import Home from './pages/Home';
import ProfileSetup from './pages/ProfileSetup';
import Ballot from './pages/Ballot';
import Leaderboard from './pages/Leaderboard';
import AdminPanel from './pages/AdminPanel';
import PaymentBanner from './components/PaymentBanner';
import { useAuth } from './_core/hooks/useAuth';

function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">{children}</div>
      {isAuthenticated && <PaymentBanner />}
    </div>
  );
}

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/profile" component={ProfileSetup} />
        <Route path="/ballot" component={Ballot} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/admin" component={AdminPanel} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

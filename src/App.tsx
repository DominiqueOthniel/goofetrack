import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./contexts/AppContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Layout } from "./components/Layout";
import Login from "./views/Login";
import Dashboard from "./views/Dashboard";
import Trucks from "./views/Trucks";
import Trips from "./views/Trips";
import Expenses from "./views/Expenses";
import Invoices from "./views/Invoices";
import Drivers from "./views/Drivers";
import ThirdParties from "./views/ThirdParties";
import Personnel from "./views/Personnel";
import ParcelShipping from "./views/ParcelShipping";
import Caisse from "./views/Caisse";
import Credits from "./views/Credits";
import AuditLogs from "./views/AuditLogs";
import NotFound from "./views/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AppProvider>
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/camions" element={<ProtectedRoute><Layout><Trucks /></Layout></ProtectedRoute>} />
            <Route path="/trajets" element={<ProtectedRoute><Layout><Trips /></Layout></ProtectedRoute>} />
            <Route path="/depenses" element={<ProtectedRoute><Layout><Expenses /></Layout></ProtectedRoute>} />
            <Route path="/factures" element={<ProtectedRoute><Layout><Invoices /></Layout></ProtectedRoute>} />
              <Route path="/chauffeurs" element={<ProtectedRoute><Layout><Drivers /></Layout></ProtectedRoute>} />
              <Route path="/tiers" element={<ProtectedRoute><Layout><ThirdParties /></Layout></ProtectedRoute>} />
              <Route path="/personnel" element={<ProtectedRoute><Layout><Personnel /></Layout></ProtectedRoute>} />
              <Route path="/envoi-colis" element={<ProtectedRoute><Layout><ParcelShipping /></Layout></ProtectedRoute>} />
              <Route path="/banque" element={<ProtectedRoute><Navigate to="/caisse" replace /></ProtectedRoute>} />
              <Route path="/caisse" element={<ProtectedRoute><Layout><Caisse /></Layout></ProtectedRoute>} />
              <Route path="/credits" element={<ProtectedRoute><Layout><Credits /></Layout></ProtectedRoute>} />
              <Route path="/historique" element={<ProtectedRoute><Layout><AuditLogs /></Layout></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </AppProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

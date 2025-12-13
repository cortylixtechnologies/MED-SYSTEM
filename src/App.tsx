import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateReferral from "./pages/CreateReferral";
import SentReferrals from "./pages/SentReferrals";
import IncomingReferrals from "./pages/IncomingReferrals";
import ReferralDetail from "./pages/ReferralDetail";
import CodeLookup from "./pages/CodeLookup";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-referral"
              element={
                <ProtectedRoute>
                  <CreateReferral />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sent-referrals"
              element={
                <ProtectedRoute>
                  <SentReferrals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/incoming-referrals"
              element={
                <ProtectedRoute>
                  <IncomingReferrals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/referral/:id"
              element={
                <ProtectedRoute>
                  <ReferralDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/code-lookup"
              element={
                <ProtectedRoute>
                  <CodeLookup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

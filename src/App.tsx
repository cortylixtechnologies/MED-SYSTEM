import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationContextProvider } from "@/contexts/NotificationContext";
import EmergencyAlertOverlay from "@/components/EmergencyAlertOverlay";
import AIChatWidget from "@/components/AIChatWidget";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateReferral from "./pages/CreateReferral";
import SentReferrals from "./pages/SentReferrals";
import IncomingReferrals from "./pages/IncomingReferrals";
import ReferralDetail from "./pages/ReferralDetail";
import CodeLookup from "./pages/CodeLookup";
import AdminDashboard from "./pages/AdminDashboard";
import Analytics from "./pages/Analytics";
import DoctorDirectory from "./pages/DoctorDirectory";
import ReferralTemplates from "./pages/ReferralTemplates";
import PatientFollowups from "./pages/PatientFollowups";
import Messages from "./pages/Messages";
import ProfileSettings from "./pages/ProfileSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NotificationContextProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <EmergencyAlertOverlay />
            <AIChatWidget />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
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
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctors"
              element={
                <ProtectedRoute>
                  <DoctorDirectory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/templates"
              element={
                <ProtectedRoute>
                  <ReferralTemplates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/followups"
              element={
                <ProtectedRoute>
                  <PatientFollowups />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfileSettings />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </NotificationContextProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

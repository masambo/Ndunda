import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { UserSync } from "@/components/auth/UserSync";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AppBootstrap } from "@/components/AppBootstrap";
import Onboarding from "./pages/Onboarding";
import SelectLanguage from "./pages/SelectLanguage";
import ChooseCity from "./pages/ChooseCity";
import Index from "./pages/Index";
import PropertyView from "./pages/PropertyView";
import Agents from "./pages/Agents";
import AgentView from "./pages/AgentView";
import AddListing from "./pages/AddListing";
import Profile from "./pages/Profile";
import BecomeAgent from "./pages/BecomeAgent";
import SavedProperties from "./pages/SavedProperties";
import MyListings from "./pages/MyListings";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import NearbyScan from "./pages/NearbyScan";
import Admin from "./pages/Admin";
import AgentDashboard from "./pages/AgentDashboard";

const queryClient = new QueryClient();

const SearchRedirect = () => {
  const location = useLocation();
  return <Navigate to={`/${location.search}`} replace />;
};

const App = () => (
  <ErrorBoundary>
    <ConvexClientProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <UserSync />
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppBootstrap>
                <Routes>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/select-language" element={<SelectLanguage />} />
              <Route path="/choose-city" element={<ChooseCity />} />
              <Route path="/" element={<Index />} />
              <Route path="/login/*" element={<Login />} />
              <Route path="/search" element={<SearchRedirect />} />
              <Route path="/property/:id" element={<PropertyView />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/agents/:id" element={<AgentView />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/add-listing" element={<AddListing />} />
                <Route path="/my-listings" element={<MyListings />} />
                <Route path="/agent-dashboard" element={<AgentDashboard />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/become-agent" element={<BecomeAgent />} />
                <Route path="/saved" element={<SavedProperties />} />
                <Route path="/saved-properties" element={<SavedProperties />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
              <Route path="/profile" element={<Profile />} />
              <Route path="/help" element={<Help />} />
              <Route path="/nearby" element={<NearbyScan />} />
              <Route path="*" element={<NotFound />} />
                </Routes>
              </AppBootstrap>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </LanguageProvider>
    </ConvexClientProvider>
  </ErrorBoundary>
);

export default App;

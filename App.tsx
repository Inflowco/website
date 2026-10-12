import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigationType } from "react-router-dom";
import { GlobalContextProviders } from "./components/_globalContextProviders";
import { AuthProvider } from "./helpers/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardLayout } from "./components/DashboardLayout";
import { PUBLIC_ONLY } from "./helpers/site";

// Public pages
import LandingPage from "./pages/_index";
import ContactPage from "./pages/contact";
import ServicesPage from "./pages/services";
import IndustrialGasPage from "./pages/industrial-gas";
import PlatformPage from "./pages/platform";
import CaseStudiesPage from "./pages/case-studies";
import AboutPage from "./pages/about";

// Auth pages
import LoginPage from "./pages/auth/login";
import RegisterPage from "./pages/auth/register";

// App pages (protected)
import DashboardPage from "./pages/app/dashboard";
import FacilitiesPage from "./pages/app/facilities";
import DiagramsPage from "./pages/app/diagrams";
import DiagramEditPage from "./pages/app/diagrams/edit";
import AlertsPage from "./pages/app/alerts";
import ReportsPage from "./pages/app/reports";
import InstallKitPage from "./pages/app/install-kit";
import SettingsPage from "./pages/app/settings";
import AssistantPage from "./pages/app/assistant";
import KnowledgeBasePage from "./pages/app/knowledge-base";
import CrmPage from "./pages/app/crm";

import "./base.css";

function ScrollManager() {
  const { pathname, search, hash } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    if (navType === "POP") return;
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, search, hash, navType]);

  return null;
}

function NotFound() {
  return (
    <div style={{ padding: "4rem 1rem", textAlign: "center", minHeight: "50vh" }}>
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist.</p>
      <p>
        Go back to the <a href={import.meta.env.BASE_URL} style={{ color: "var(--primary)" }}>home page</a>.
      </p>
    </div>
  );
}

// Layout wrapper for public pages
import { Layout } from "./components/Layout";

function PublicLayout({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>;
}

// Layout wrapper for app pages
function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ScrollManager />
      <GlobalContextProviders>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
            <Route path="/services" element={<PublicLayout><ServicesPage /></PublicLayout>} />
            <Route path="/industrial-gas" element={<PublicLayout><IndustrialGasPage /></PublicLayout>} />
            <Route path="/platform" element={<PublicLayout><PlatformPage /></PublicLayout>} />
            <Route path="/case-studies" element={<PublicLayout><CaseStudiesPage /></PublicLayout>} />
            <Route path="/results" element={<Navigate to="/case-studies" replace />} />
            <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
            <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />

            {/* Old IIS site paths that Xcel and LinkedIn still link to */}
            <Route path="/About-Us" element={<Navigate to="/about" replace />} />
            <Route path="/Contact" element={<Navigate to="/contact" replace />} />
            <Route path="/Services" element={<Navigate to="/services" replace />} />

            {PUBLIC_ONLY ? (
              // Static site: the platform login lives in the next release.
              <>
                <Route path="/auth/*" element={<Navigate to="/platform" replace />} />
                <Route path="/app/*" element={<Navigate to="/platform" replace />} />
              </>
            ) : (
              <>
                {/* Auth routes */}
                <Route path="/auth/login" element={<LoginPage />} />
                <Route path="/auth/register" element={<RegisterPage />} />

                {/* App routes (protected) */}
                <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
                <Route path="/app/dashboard" element={<AppLayout><DashboardPage /></AppLayout>} />
                <Route path="/app/facilities" element={<AppLayout><FacilitiesPage /></AppLayout>} />
                <Route path="/app/diagrams" element={<AppLayout><DiagramsPage /></AppLayout>} />
                <Route path="/app/diagrams/:id" element={<AppLayout><DiagramEditPage /></AppLayout>} />
                <Route path="/app/alerts" element={<AppLayout><AlertsPage /></AppLayout>} />
                <Route path="/app/reports" element={<AppLayout><ReportsPage /></AppLayout>} />
                <Route path="/app/install-kit" element={<AppLayout><InstallKitPage /></AppLayout>} />
                <Route path="/app/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
                <Route path="/app/assistant" element={<AppLayout><AssistantPage /></AppLayout>} />
                <Route path="/app/knowledge-base" element={<AppLayout><KnowledgeBasePage /></AppLayout>} />
                <Route path="/app/crm" element={<AppLayout><CrmPage /></AppLayout>} />
              </>
            )}

            <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
          </Routes>
        </AuthProvider>
      </GlobalContextProviders>
    </BrowserRouter>
  );
}

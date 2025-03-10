import { AuthProvider, useAuth } from "../context/AuthContext";

import Layout from "../components/Layout";
import Link from "next/link";
import '../styles/globals.css';
import DashboardLayout from "@/components/DashboarLayout";

// Inner component to use auth context
function AppContent({ Component, pageProps, router }) {
  const { user, loading } = useAuth();
  console.log('AppContent - Path:', router.pathname, 'User:', user, 'Loading:', loading);

  if (loading) return <p>Loading...</p>;
  if (router.pathname === "/") return <Component {...pageProps} />;
  if (!user) return <div>Please log in <Link href="/">Login</Link></div>;

  const isDashboard = router.pathname.startsWith("/dashboard");
  const LayoutComponent = isDashboard ? DashboardLayout : Layout;

  return (
    <LayoutComponent>
      <Component {...pageProps} />
    </LayoutComponent>
  );
}

export default function MyApp({ Component, pageProps, router }) {
  return (
    <AuthProvider>
      <AppContent Component={Component} pageProps={pageProps} router={router} />
    </AuthProvider>
  );
}
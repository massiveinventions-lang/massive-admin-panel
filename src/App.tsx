import { Switch, Route, Router as WouterRouter, useLocation, Link } from "wouter";
import { useEffect } from "react";
import { getToken } from "@/lib/api";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import Newsletter from "@/pages/Newsletter";
import ReplacementRequests from "@/pages/ReplacementRequests";
import Layout from "@/components/Layout";

function PrivateRoute({ component: Component }: { component: React.ComponentType }) {
  const [, navigate] = useLocation();
  const isAuthed = !!getToken();

  useEffect(() => {
    if (!isAuthed) navigate("/login");
  }, [isAuthed, navigate]);

  if (!isAuthed) return null;
  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location]);
  return null;
}

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-3xl font-black mb-2">Page not found</h1>
      <p className="text-[var(--foreground)]/60 mb-6">
        The page you're looking for doesn't exist.
      </p>
      <Link
        href="/"
        className="text-[var(--accent-brown)] hover:underline font-semibold"
      >
        Back to dashboard
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <ScrollToTop />
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/" component={() => <PrivateRoute component={Dashboard} />} />
        <Route path="/orders" component={() => <PrivateRoute component={Orders} />} />
        <Route path="/orders/:id" component={() => <PrivateRoute component={OrderDetail} />} />
        <Route path="/newsletter" component={() => <PrivateRoute component={Newsletter} />} />
        <Route path="/replacement-requests" component={() => <PrivateRoute component={ReplacementRequests} />} />
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import FavoritesPage from "@/pages/favorites-page";
import TrendingPage from "@/pages/trending-page";
import { ProtectedRoute } from "./lib/protected-route";
import Navbar from "./components/navbar";

function Router() {
  return (
    <>
      <Navbar />
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <ProtectedRoute path="/" component={HomePage} />
        <ProtectedRoute path="/favorites" component={FavoritesPage} />
        <ProtectedRoute path="/trending" component={TrendingPage} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PoetryEngine } from "@/pages/PoetryEngine";

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: { retry: 1 },
    queries: { staleTime: 30_000 },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={PoetryEngine} />
      <Route component={PoetryEngine} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

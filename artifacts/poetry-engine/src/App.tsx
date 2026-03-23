import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Router, Switch, Route } from "wouter";
import { Home } from "@/pages/Home";
import { CuratedPoem } from "@/pages/CuratedPoem";
import { PoetryEngine } from "@/pages/PoetryEngine";

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: { retry: 1 },
    queries: { staleTime: 30_000 },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/poem/:id">
              {(params) => <CuratedPoem id={(params as { id: string }).id} />}
            </Route>
            <Route path="/visualize" component={PoetryEngine} />
          </Switch>
        </Router>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

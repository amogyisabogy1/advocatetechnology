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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PoetryEngine />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

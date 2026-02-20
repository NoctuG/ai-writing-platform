import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import PaperGenerate from "./pages/PaperGenerate";
import PaperList from "./pages/PaperList";
import PaperEdit from "./pages/PaperEdit";
import Dashboard from "./pages/Dashboard";
import KnowledgeBase from "./pages/KnowledgeBase";
import ChartTools from "./pages/ChartTools";
import TranslationTools from "./pages/TranslationTools";
import RecycleBin from "./pages/RecycleBin";


function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/papers" component={PaperList} />
      <Route path="/paper/:id" component={PaperGenerate} />
      <Route path="/paper/:id/edit" component={PaperEdit} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/knowledge" component={KnowledgeBase} />
      <Route path="/charts" component={ChartTools} />
      <Route path="/translation" component={TranslationTools} />
      <Route path="/recycle-bin" component={RecycleBin} />

      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

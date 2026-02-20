import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import NotFound from "@/pages/NotFound";
import type { ReactNode } from "react";
import { Route, Switch, useLocation } from "wouter";
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

interface PageTransitionProps {
  children: ReactNode;
  shouldAnimate: boolean;
}

function PageTransition({ children, shouldAnimate }: PageTransitionProps) {
  if (!shouldAnimate) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="min-h-screen bg-background text-foreground"
    >
      {children}
    </motion.div>
  );
}

function Router() {
  const [location] = useLocation();
  const disableTransition = /^\/paper\/[^/]+\/edit$/.test(location);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Switch key={location} location={location}>
        <Route path={"/"}>
          {() => (
            <PageTransition shouldAnimate={!disableTransition}>
              <Home />
            </PageTransition>
          )}
        </Route>
        <Route path="/papers">
          {() => (
            <PageTransition shouldAnimate={!disableTransition}>
              <PaperList />
            </PageTransition>
          )}
        </Route>
        <Route path="/paper/:id">
          {() => (
            <PageTransition shouldAnimate={!disableTransition}>
              <PaperGenerate />
            </PageTransition>
          )}
        </Route>
        <Route path="/paper/:id/edit">
          {() => (
            <PageTransition shouldAnimate={false}>
              <PaperEdit />
            </PageTransition>
          )}
        </Route>
        <Route path="/dashboard">
          {() => (
            <PageTransition shouldAnimate={!disableTransition}>
              <Dashboard />
            </PageTransition>
          )}
        </Route>
        <Route path="/knowledge">
          {() => (
            <PageTransition shouldAnimate={!disableTransition}>
              <KnowledgeBase />
            </PageTransition>
          )}
        </Route>
        <Route path="/charts">
          {() => (
            <PageTransition shouldAnimate={!disableTransition}>
              <ChartTools />
            </PageTransition>
          )}
        </Route>
        <Route path="/translation">
          {() => (
            <PageTransition shouldAnimate={!disableTransition}>
              <TranslationTools />
            </PageTransition>
          )}
        </Route>
        <Route path="/recycle-bin">
          {() => (
            <PageTransition shouldAnimate={!disableTransition}>
              <RecycleBin />
            </PageTransition>
          )}
        </Route>

        <Route path={"/404"}>
          {() => (
            <PageTransition shouldAnimate={!disableTransition}>
              <NotFound />
            </PageTransition>
          )}
        </Route>
        {/* Final fallback route */}
        <Route>
          {() => (
            <PageTransition shouldAnimate={!disableTransition}>
              <NotFound />
            </PageTransition>
          )}
        </Route>
      </Switch>
    </AnimatePresence>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

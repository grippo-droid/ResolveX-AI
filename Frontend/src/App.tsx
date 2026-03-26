import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";

const Mainpage = React.lazy(() => import("./pages/Mainpage"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));

export default function App() {
  return (
    <ErrorBoundary fallbackMessage="The application encountered a critical unhandled error.">
      <BrowserRouter>
        <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center text-[#0A0A0A] font-medium tracking-wide">Loading application...</div>}>
          <Routes>
            <Route path="/"          element={<Mainpage />}  />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
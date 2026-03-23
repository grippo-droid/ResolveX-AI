import { BrowserRouter, Routes, Route } from "react-router-dom";
import Mainpage   from "./pages/Mainpage";
import Dashboard  from "./pages/Dashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Mainpage />}  />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
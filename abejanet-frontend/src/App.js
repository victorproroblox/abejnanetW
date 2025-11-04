import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ColmenasPage from "./pages/ColmenasPage";
import ColmenaDetallePage from "./pages/ColmenaDetallePage";
import Cuenta from "./pages/cuenta";
import Sensores from "./pages/Sensores"; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/colmenas" element={<ColmenasPage />} />
        <Route path="/colmena/:id" element={<ColmenaDetallePage />} />
        <Route path="/cuenta" element={<Cuenta />} /> 
        <Route path="/sensores" element={<Sensores />} />
      </Routes>
    </Router>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ColmenasPage from "./pages/ColmenasPage";
import ColmenaDetallePage from "./pages/ColmenaDetallePage";
import Cuenta from "./pages/cuenta";
import Sensores from "./pages/Sensores"; 
import CreateColmenaPage from "./pages/CreateColmenaPage";
import EditColmenaPage from "./pages/EditColmenaPage"; 
import Crud_usu from "./pages/Crud_usu";
import ApiariosPage from "./pages/ApiariosPage";

function App() {
  return (
    <Router>
      <Routes>

        {/* Rutas principales */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/colmenas" element={<ColmenasPage />} />
        <Route path="/colmena/:id" element={<ColmenaDetallePage />} />
        <Route path="/cuenta" element={<Cuenta />} /> 
        <Route path="/sensores" element={<Sensores />} />
        <Route path="/colmenas/crear" element={<CreateColmenaPage />} />
        <Route path="/colmenas/editar/:id" element={<EditColmenaPage />} />
        <Route path="/usuarios" element={<Crud_usu />} />
        <Route path="/apiarios" element={<ApiariosPage />} />
      </Routes>
    </Router>
  );
}

export default App;
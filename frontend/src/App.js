import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";

import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

import LoginPage from "./pages/Login";
import PainelGeral from "./pages/PainelGeral";
import DizimistasPage from "./pages/Dizimistas";
import ContribuicoesPage from "./pages/Contribuicoes";
import RelatoriosPage from "./pages/Relatorios";
import ConfiguracoesPage from "./pages/Configuracoes";

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><PainelGeral /></ProtectedRoute>} />
          <Route path="/dizimistas" element={<ProtectedRoute><DizimistasPage /></ProtectedRoute>} />
          <Route path="/contribuicoes" element={<ProtectedRoute><ContribuicoesPage /></ProtectedRoute>} />
          <Route path="/relatorios" element={<ProtectedRoute><RelatoriosPage /></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute><ConfiguracoesPage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

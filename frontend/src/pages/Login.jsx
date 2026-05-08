import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) navigate("/");
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(username, password);
      toast.success("Bem-vindo!");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div
        className="login-hero"
        style={{ backgroundImage: `url(https://images.unsplash.com/photo-1741903736332-8f87836f88eb?q=85&w=1920&auto=format&fit=crop)` }}
      >
        <div className="login-hero-overlay" />
        <div className="login-hero-content">
          <blockquote className="text-xl italic font-light mb-2">
            "Cada um dê como dispôs em seu coração, sem pena nem constrangimento, pois Deus ama a quem dá com alegria."
          </blockquote>
          <p className="text-sm opacity-80">2 Coríntios 9,7</p>
        </div>
      </div>

      <div className="login-form-container">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <img
                src="https://customer-assets.emergentagent.com/job_permission-manager-8/artifacts/hr97hygf_Logo%20PSJT.jpg"
                alt="Paróquia São Judas Tadeu"
                className="w-32 h-32 rounded-full object-cover shadow-lg border-4 border-red-600"
              />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-red-800">Paróquia São Judas Tadeu</h1>
            <p className="text-muted-foreground mt-1">Tatuapé - São Paulo</p>
            <p className="text-2xl font-bold text-green-600 mt-4">Sistema de Gestão de Dízimos</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                data-testid="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu usuário"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  data-testid="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              disabled={isLoading}
              data-testid="login-submit"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </div>

        <div className="absolute bottom-16 right-4 text-sm text-muted-foreground">
          Versão 1.0.1
        </div>
      </div>
    </div>
  );
}

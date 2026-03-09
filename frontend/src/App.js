import { useState, useEffect, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { 
  Users, Home, FileText, Settings, LogOut, Menu, X, 
  Plus, Edit, Trash2, Eye, EyeOff, Check, ChevronRight,
  DollarSign, TrendingUp, UserCheck, Church, Calendar, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem("token");
      setToken(null);
      delete axios.defaults.headers.common["Authorization"];
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const response = await axios.post(`${API}/auth/login`, { username, password });
    const { access_token, user: userData } = response.data;
    localStorage.setItem("token", access_token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
  };

  const hasPermission = (resource, action) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    return user.permissions?.[`${resource}_${action}`] || false;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, hasPermission, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Login Page
const LoginPage = () => {
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
            "Trazei todos os dízimos à casa do tesouro..."
          </blockquote>
          <p className="text-sm opacity-80">Malaquias 3:10</p>
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
          
          <p className="text-center text-sm text-muted-foreground">
            Credenciais padrão: admin / admin123
          </p>
        </div>
      </div>
    </div>
  );
};

// Sidebar
const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { path: "/", icon: Home, label: "Dashboard", show: true },
    { path: "/dizimistas", icon: Users, label: "Dizimistas", show: hasPermission("dizimistas", "view") },
    { path: "/relatorios", icon: FileText, label: "Relatórios", show: hasPermission("relatorios", "view") },
    { path: "/configuracoes", icon: Settings, label: "Configurações", show: user?.role === "admin" },
  ];

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside className={`sidebar ${!isOpen ? 'sidebar-collapsed lg:translate-x-0' : ''}`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <img 
              src="https://customer-assets.emergentagent.com/job_permission-manager-8/artifacts/hr97hygf_Logo%20PSJT.jpg" 
              alt="PSJT" 
              className="w-10 h-10 rounded-full object-cover border-2 border-amber-400"
            />
            <div>
              <h2 className="font-semibold">São Judas Tadeu</h2>
              <p className="text-xs opacity-70">Gestão de Dízimos</p>
            </div>
          </div>
          
          <nav className="space-y-1">
            {navItems.filter(item => item.show).map(item => (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); onClose(); }}
                className={`sidebar-link w-full ${location.pathname === item.path ? 'active' : ''}`}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-primary-foreground/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center text-sm font-medium">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs opacity-70 capitalize">{user?.role}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
            onClick={handleLogout}
            data-testid="logout-button"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>
    </>
  );
};

// Layout
const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <header className="main-header px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              className="lg:hidden p-2 hover:bg-muted rounded-lg"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              data-testid="mobile-menu-toggle"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="lg:hidden" />
          </div>
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

// Dashboard
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { hasPermission } = useAuth();

  useEffect(() => {
    if (hasPermission("relatorios", "view")) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/relatorios/resumo`);
      setStats(response.data);
    } catch (error) {
      console.error("Erro ao buscar estatísticas");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema de dízimos</p>
        </div>

        {hasPermission("relatorios", "view") ? (
          <div className="bento-grid">
            <Card className="animate-fade-in" data-testid="card-dizimistas">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Dizimistas</CardTitle>
                <UserCheck className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{loading ? "-" : stats?.total_dizimistas || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Membros ativos</p>
              </CardContent>
            </Card>

            <Card className="animate-fade-in animate-delay-100" data-testid="card-arrecadado">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Arrecadado</CardTitle>
                <DollarSign className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{loading ? "-" : formatCurrency(stats?.total_arrecadado)}</div>
                <p className="text-xs text-muted-foreground mt-1">Todas as contribuições</p>
              </CardContent>
            </Card>

            <Card className="animate-fade-in animate-delay-200" data-testid="card-contribuicoes">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Contribuições</CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{loading ? "-" : stats?.total_contribuicoes || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Registros no sistema</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Você não tem permissão para visualizar estatísticas.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

// Dizimistas Page
const DizimistasPage = () => {
  const [dizimistas, setDizimistas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDizimista, setEditingDizimista] = useState(null);
  const [formData, setFormData] = useState({ nome: "", telefone: "", email: "", endereco: "", valor_dizimo: 0 });
  const { hasPermission } = useAuth();

  useEffect(() => {
    fetchDizimistas();
  }, []);

  const fetchDizimistas = async () => {
    try {
      const response = await axios.get(`${API}/dizimistas`);
      setDizimistas(response.data);
    } catch (error) {
      toast.error("Erro ao buscar dizimistas");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDizimista) {
        await axios.put(`${API}/dizimistas/${editingDizimista.id}`, formData);
        toast.success("Dizimista atualizado!");
      } else {
        await axios.post(`${API}/dizimistas`, formData);
        toast.success("Dizimista cadastrado!");
      }
      setDialogOpen(false);
      setEditingDizimista(null);
      setFormData({ nome: "", telefone: "", email: "", endereco: "", valor_dizimo: 0 });
      fetchDizimistas();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao salvar");
    }
  };

  const handleEdit = (dizimista) => {
    setEditingDizimista(dizimista);
    setFormData({
      nome: dizimista.nome,
      telefone: dizimista.telefone,
      email: dizimista.email,
      endereco: dizimista.endereco,
      valor_dizimo: dizimista.valor_dizimo
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja excluir este dizimista?")) return;
    try {
      await axios.delete(`${API}/dizimistas/${id}`);
      toast.success("Dizimista excluído!");
      fetchDizimistas();
    } catch (error) {
      toast.error("Erro ao excluir");
    }
  };

  const canEdit = hasPermission("dizimistas", "edit");

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dizimistas</h1>
            <p className="text-muted-foreground">Gerenciar membros dizimistas</p>
          </div>
          {canEdit && (
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingDizimista(null); setFormData({ nome: "", telefone: "", email: "", endereco: "", valor_dizimo: 0 }); } }}>
              <DialogTrigger asChild>
                <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90" data-testid="btn-novo-dizimista">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Dizimista
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingDizimista ? "Editar Dizimista" : "Novo Dizimista"}</DialogTitle>
                  <DialogDescription>Preencha os dados do dizimista</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      data-testid="input-nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        data-testid="input-telefone"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        data-testid="input-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      data-testid="input-endereco"
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valor_dizimo">Valor do Dízimo (R$)</Label>
                    <Input
                      id="valor_dizimo"
                      data-testid="input-valor"
                      type="number"
                      step="0.01"
                      value={formData.valor_dizimo}
                      onChange={(e) => setFormData({ ...formData, valor_dizimo: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" data-testid="btn-salvar-dizimista">
                      {editingDizimista ? "Atualizar" : "Cadastrar"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Valor Dízimo</TableHead>
                  <TableHead>Status</TableHead>
                  {canEdit && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={canEdit ? 6 : 5} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : dizimistas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canEdit ? 6 : 5} className="text-center py-8 text-muted-foreground">
                      Nenhum dizimista cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  dizimistas.map((dizimista) => (
                    <TableRow key={dizimista.id} data-testid={`row-dizimista-${dizimista.id}`}>
                      <TableCell className="font-medium">{dizimista.nome}</TableCell>
                      <TableCell>{dizimista.telefone || "-"}</TableCell>
                      <TableCell>{dizimista.email || "-"}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dizimista.valor_dizimo || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={dizimista.ativo ? "default" : "secondary"}>
                          {dizimista.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(dizimista)} data-testid={`btn-edit-${dizimista.id}`}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(dizimista.id)} data-testid={`btn-delete-${dizimista.id}`}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

// Relatorios Page
const RelatoriosPage = () => {
  const [resumo, setResumo] = useState(null);
  const [contribuicoes, setContribuicoes] = useState([]);
  const [valoresMensais, setValoresMensais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ mes: "", ano: "", valor: "", observacao: "" });
  const { hasPermission } = useAuth();

  const meses = [
    { value: "1", label: "Janeiro" },
    { value: "2", label: "Fevereiro" },
    { value: "3", label: "Março" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Maio" },
    { value: "6", label: "Junho" },
    { value: "7", label: "Julho" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" }
  ];

  const currentYear = new Date().getFullYear();
  const anos = Array.from({ length: 10 }, (_, i) => currentYear - i);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resumoRes, contribRes, valoresRes] = await Promise.all([
        axios.get(`${API}/relatorios/resumo`),
        axios.get(`${API}/relatorios/contribuicoes`),
        axios.get(`${API}/valores-mensais`)
      ]);
      setResumo(resumoRes.data);
      setContribuicoes(contribRes.data);
      setValoresMensais(valoresRes.data);
    } catch (error) {
      toast.error("Erro ao buscar relatórios");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/valores-mensais`, {
        mes: parseInt(formData.mes),
        ano: parseInt(formData.ano),
        valor: parseFloat(formData.valor),
        observacao: formData.observacao
      });
      toast.success("Valor mensal registrado!");
      setDialogOpen(false);
      setFormData({ mes: "", ano: "", valor: "", observacao: "" });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao salvar");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja excluir este valor mensal?")) return;
    try {
      await axios.delete(`${API}/valores-mensais/${id}`);
      toast.success("Valor excluído!");
      fetchData();
    } catch (error) {
      toast.error("Erro ao excluir");
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getMesNome = (mes) => {
    return meses.find(m => m.value === String(mes))?.label || mes;
  };

  // Prepare chart data - last 12 months
  const prepareChartData = () => {
    if (!resumo?.por_mes) return [];
    
    const data = [];
    const today = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const mesNome = meses[date.getMonth()].label.substring(0, 3);
      const valor = resumo.por_mes[key] || 0;
      
      data.push({
        mes: `${mesNome}/${date.getFullYear().toString().slice(-2)}`,
        valor: valor,
        mesCompleto: `${meses[date.getMonth()].label} ${date.getFullYear()}`
      });
    }
    
    return data;
  };

  const chartData = prepareChartData();
  const canEdit = hasPermission("relatorios", "edit");

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border rounded-lg shadow-lg p-3">
          <p className="font-medium">{payload[0].payload.mesCompleto}</p>
          <p className="text-primary font-bold">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
            <p className="text-muted-foreground">Visualize os relatórios de contribuições</p>
          </div>
          {canEdit && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90" data-testid="btn-novo-valor">
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Mês Anterior
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Valor Mensal</DialogTitle>
                  <DialogDescription>Insira o valor total de um mês anterior</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mes">Mês *</Label>
                      <Select value={formData.mes} onValueChange={(value) => setFormData({ ...formData, mes: value })}>
                        <SelectTrigger data-testid="select-mes">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {meses.map(m => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ano">Ano *</Label>
                      <Select value={formData.ano} onValueChange={(value) => setFormData({ ...formData, ano: value })}>
                        <SelectTrigger data-testid="select-ano">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {anos.map(a => (
                            <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor Total (R$) *</Label>
                    <Input
                      id="valor"
                      data-testid="input-valor-mensal"
                      type="number"
                      step="0.01"
                      value={formData.valor}
                      onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                      placeholder="0,00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="observacao">Observação</Label>
                    <Input
                      id="observacao"
                      data-testid="input-observacao"
                      value={formData.observacao}
                      onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                      placeholder="Ex: Dízimos + ofertas"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" data-testid="btn-salvar-valor">
                      Registrar
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="bento-grid">
          <Card data-testid="card-total-dizimistas">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Dizimistas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loading ? "-" : resumo?.total_dizimistas || 0}</div>
            </CardContent>
          </Card>

          <Card data-testid="card-total-arrecadado">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Arrecadado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loading ? "-" : formatCurrency(resumo?.total_arrecadado)}</div>
            </CardContent>
          </Card>

          <Card data-testid="card-total-contribuicoes">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Contribuições</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loading ? "-" : resumo?.total_contribuicoes || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Contributions Chart */}
        <Card className="bento-card-wide" data-testid="card-grafico">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Contribuições Mensais
            </CardTitle>
            <CardDescription>Últimos 12 meses de arrecadação</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Carregando...
              </div>
            ) : chartData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="mes" 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickFormatter={(value) => `R$${(value/1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="valor" 
                      fill="#b91c1c" 
                      radius={[4, 4, 0, 0]}
                      name="Arrecadado"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Values Table */}
        {valoresMensais.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Valores Mensais Registrados
              </CardTitle>
              <CardDescription>Totais mensais inseridos manualmente</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês/Ano</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Observação</TableHead>
                    {canEdit && <TableHead className="text-right">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {valoresMensais
                    .sort((a, b) => (b.ano * 100 + b.mes) - (a.ano * 100 + a.mes))
                    .map((valor) => (
                    <TableRow key={valor.id} data-testid={`row-valor-${valor.id}`}>
                      <TableCell className="font-medium">
                        {getMesNome(valor.mes)} / {valor.ano}
                      </TableCell>
                      <TableCell>{formatCurrency(valor.valor)}</TableCell>
                      <TableCell>{valor.observacao || "-"}</TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDelete(valor.id)}
                            data-testid={`btn-delete-valor-${valor.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Contribuições</CardTitle>
            <CardDescription>Lista de todas as contribuições registradas</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dizimista</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : contribuicoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhuma contribuição registrada
                    </TableCell>
                  </TableRow>
                ) : (
                  contribuicoes.map((contrib) => (
                    <TableRow key={contrib.id}>
                      <TableCell className="font-medium">{contrib.dizimista_nome}</TableCell>
                      <TableCell>{formatCurrency(contrib.valor)}</TableCell>
                      <TableCell>{formatDate(contrib.data)}</TableCell>
                      <TableCell>{contrib.observacao || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

// Configuracoes Page
const ConfiguracoesPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({ username: "", password: "", name: "", role: "user" });
  const [permissions, setPermissions] = useState({
    dizimistas_view: false,
    dizimistas_edit: false,
    relatorios_view: false,
    relatorios_edit: false
  });
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      setUsers(response.data);
    } catch (error) {
      toast.error("Erro ao buscar usuários");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const updateData = { name: formData.name, role: formData.role };
        await axios.put(`${API}/users/${editingUser.id}`, updateData);
        toast.success("Usuário atualizado!");
      } else {
        await axios.post(`${API}/users`, formData);
        toast.success("Usuário criado!");
      }
      setDialogOpen(false);
      setEditingUser(null);
      setFormData({ username: "", password: "", name: "", role: "user" });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao salvar");
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: "",
      name: user.name,
      role: user.role
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja excluir este usuário?")) return;
    try {
      await axios.delete(`${API}/users/${id}`);
      toast.success("Usuário excluído!");
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao excluir");
    }
  };

  const openPermissionsDialog = (user) => {
    setSelectedUser(user);
    setPermissions(user.permissions || {
      dizimistas_view: false,
      dizimistas_edit: false,
      relatorios_view: false,
      relatorios_edit: false
    });
    setPermissionsDialogOpen(true);
  };

  const handleSavePermissions = async () => {
    try {
      await axios.put(`${API}/users/${selectedUser.id}/permissions`, permissions);
      toast.success("Permissões atualizadas!");
      setPermissionsDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error("Erro ao salvar permissões");
    }
  };

  const getPermissionLevel = (perms) => {
    if (!perms) return "Nenhum";
    const hasView = perms.dizimistas_view || perms.relatorios_view;
    const hasEdit = perms.dizimistas_edit || perms.relatorios_edit;
    if (hasEdit) return "Editar";
    if (hasView) return "Visualizar";
    return "Nenhum";
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">Gerenciar usuários e permissões do sistema</p>
        </div>

        <Tabs defaultValue="usuarios" className="space-y-6">
          <TabsList>
            <TabsTrigger value="usuarios" data-testid="tab-usuarios">Usuários</TabsTrigger>
            <TabsTrigger value="permissoes" data-testid="tab-permissoes">Permissões</TabsTrigger>
          </TabsList>

          <TabsContent value="usuarios" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingUser(null); setFormData({ username: "", password: "", name: "", role: "user" }); } }}>
                <DialogTrigger asChild>
                  <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90" data-testid="btn-novo-usuario">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingUser ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
                    <DialogDescription>
                      {editingUser ? "Atualize os dados do usuário" : "Preencha os dados do novo usuário"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Usuário *</Label>
                      <Input
                        id="username"
                        data-testid="input-username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        disabled={!!editingUser}
                        required={!editingUser}
                      />
                    </div>
                    {!editingUser && (
                      <div className="space-y-2">
                        <Label htmlFor="password">Senha *</Label>
                        <Input
                          id="password"
                          data-testid="input-password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo *</Label>
                      <Input
                        id="name"
                        data-testid="input-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Tipo de Usuário</Label>
                      <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                        <SelectTrigger data-testid="select-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Usuário</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button type="submit" data-testid="btn-salvar-usuario">
                        {editingUser ? "Atualizar" : "Criar Usuário"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nenhum usuário cadastrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>
                            <Badge className={user.role === "admin" ? "badge-admin" : "badge-user"}>
                              {user.role === "admin" ? "Administrador" : "Usuário"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.active ? "default" : "secondary"}>
                              {user.active ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(user)} data-testid={`btn-edit-user-${user.id}`}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              {user.id !== currentUser?.id && (
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)} data-testid={`btn-delete-user-${user.id}`}>
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Permissões</CardTitle>
                <CardDescription>
                  Defina as permissões de acesso para cada usuário. Administradores têm acesso total automaticamente.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Dizimistas</TableHead>
                      <TableHead>Relatórios</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id} data-testid={`row-perm-${user.id}`}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">{user.username}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={user.role === "admin" ? "badge-admin" : "badge-user"}>
                              {user.role === "admin" ? "Admin" : "Usuário"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.role === "admin" ? (
                              <Badge className="badge-full">Acesso Total</Badge>
                            ) : (
                              <div className="flex gap-1">
                                {user.permissions?.dizimistas_edit ? (
                                  <Badge className="badge-edit">Editar</Badge>
                                ) : user.permissions?.dizimistas_view ? (
                                  <Badge className="badge-view">Visualizar</Badge>
                                ) : (
                                  <Badge variant="outline">Nenhum</Badge>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.role === "admin" ? (
                              <Badge className="badge-full">Acesso Total</Badge>
                            ) : (
                              <div className="flex gap-1">
                                {user.permissions?.relatorios_edit ? (
                                  <Badge className="badge-edit">Editar</Badge>
                                ) : user.permissions?.relatorios_view ? (
                                  <Badge className="badge-view">Visualizar</Badge>
                                ) : (
                                  <Badge variant="outline">Nenhum</Badge>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {user.role !== "admin" && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => openPermissionsDialog(user)}
                                data-testid={`btn-perm-${user.id}`}
                              >
                                <Settings className="w-4 h-4 mr-2" />
                                Configurar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Permissions Dialog */}
            <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Configurar Permissões</DialogTitle>
                  <DialogDescription>
                    Defina as permissões para {selectedUser?.name}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Dizimistas
                    </h4>
                    <div className="ml-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="dizimistas_view" className="cursor-pointer">Visualizar</Label>
                        <Switch
                          id="dizimistas_view"
                          data-testid="switch-dizimistas-view"
                          checked={permissions.dizimistas_view}
                          onCheckedChange={(checked) => setPermissions({ ...permissions, dizimistas_view: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="dizimistas_edit" className="cursor-pointer">Editar / Criar / Excluir</Label>
                        <Switch
                          id="dizimistas_edit"
                          data-testid="switch-dizimistas-edit"
                          checked={permissions.dizimistas_edit}
                          onCheckedChange={(checked) => setPermissions({ ...permissions, dizimistas_edit: checked, dizimistas_view: checked || permissions.dizimistas_view })}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Relatórios
                    </h4>
                    <div className="ml-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="relatorios_view" className="cursor-pointer">Visualizar</Label>
                        <Switch
                          id="relatorios_view"
                          data-testid="switch-relatorios-view"
                          checked={permissions.relatorios_view}
                          onCheckedChange={(checked) => setPermissions({ ...permissions, relatorios_view: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="relatorios_edit" className="cursor-pointer">Editar</Label>
                        <Switch
                          id="relatorios_edit"
                          data-testid="switch-relatorios-edit"
                          checked={permissions.relatorios_edit}
                          onCheckedChange={(checked) => setPermissions({ ...permissions, relatorios_edit: checked, relatorios_view: checked || permissions.relatorios_view })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPermissionsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSavePermissions} data-testid="btn-salvar-permissoes">
                    Salvar Permissões
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

// App
function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dizimistas" element={<ProtectedRoute><DizimistasPage /></ProtectedRoute>} />
          <Route path="/relatorios" element={<ProtectedRoute><RelatoriosPage /></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute><ConfiguracoesPage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

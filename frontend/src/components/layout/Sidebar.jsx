import { useLocation, useNavigate } from "react-router-dom";
import {
  Users, Home, FileText, Settings, LogOut,
  DollarSign,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "../../contexts/AuthContext";

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { path: "/", icon: Home, label: "Painel Geral", show: hasPermission("dashboard", "view") || user?.role === "admin" },
    { path: "/dizimistas", icon: Users, label: "Dizimistas", show: hasPermission("dizimistas", "view") },
    { path: "/contribuicoes", icon: DollarSign, label: "Contribuições", show: hasPermission("contribuicoes", "view") },
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

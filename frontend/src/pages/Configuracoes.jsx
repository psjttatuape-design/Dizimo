import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Plus, Edit, Trash2, Settings, Home, Users, DollarSign, FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import { Layout } from "../components/layout/Layout";
import { useAuth } from "../contexts/AuthContext";
import { API } from "../lib/api";

const DEFAULT_PERMISSIONS = {
  dashboard_view: true,
  dizimistas_view: false,
  dizimistas_edit: false,
  contribuicoes_view: false,
  contribuicoes_edit: false,
  relatorios_view: false,
  relatorios_edit: false,
};

export default function ConfiguracoesPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({ username: "", password: "", name: "", role: "user" });
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
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
        await axios.put(`${API}/users/${editingUser.id}`, { name: formData.name, role: formData.role });
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
    setFormData({ username: user.username, password: "", name: user.name, role: user.role });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
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
    setPermissions(user.permissions || DEFAULT_PERMISSIONS);
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
                    <DialogDescription>{editingUser ? "Atualize os dados do usuário" : "Preencha os dados do novo usuário"}</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Usuário *</Label>
                      <Input id="username" data-testid="input-username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} disabled={!!editingUser} required={!editingUser} />
                    </div>
                    {!editingUser && (
                      <div className="space-y-2">
                        <Label htmlFor="password">Senha *</Label>
                        <Input id="password" data-testid="input-password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo *</Label>
                      <Input id="name" data-testid="input-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Tipo de Usuário</Label>
                      <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                        <SelectTrigger data-testid="select-role"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Usuário</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button type="submit" data-testid="btn-salvar-usuario">{editingUser ? "Atualizar" : "Criar Usuário"}</Button>
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
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                    ) : users.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum usuário cadastrado</TableCell></TableRow>
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
                            <Badge variant={user.active ? "default" : "secondary"}>{user.active ? "Ativo" : "Inativo"}</Badge>
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
                <CardDescription>Defina as permissões de acesso para cada usuário. Administradores têm acesso total automaticamente.</CardDescription>
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
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
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
                            {user.role === "admin" ? <Badge className="badge-full">Acesso Total</Badge> : (
                              <PermissionBadge edit={user.permissions?.dizimistas_edit} view={user.permissions?.dizimistas_view} />
                            )}
                          </TableCell>
                          <TableCell>
                            {user.role === "admin" ? <Badge className="badge-full">Acesso Total</Badge> : (
                              <PermissionBadge edit={user.permissions?.relatorios_edit} view={user.permissions?.relatorios_view} />
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {user.role !== "admin" && (
                              <Button variant="outline" size="sm" onClick={() => openPermissionsDialog(user)} data-testid={`btn-perm-${user.id}`}>
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

            <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Configurar Permissões</DialogTitle>
                  <DialogDescription>Defina as permissões para {selectedUser?.name}</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4 max-h-[400px] overflow-y-auto">
                  <PermissionGroup icon={Home} label="Dashboard">
                    <PermissionToggle id="dashboard_view" label="Visualizar" checked={permissions.dashboard_view} onChange={(v) => setPermissions({ ...permissions, dashboard_view: v })} />
                  </PermissionGroup>

                  <PermissionGroup icon={Users} label="Dizimistas">
                    <PermissionToggle id="dizimistas_view" testId="switch-dizimistas-view" label="Visualizar" checked={permissions.dizimistas_view} onChange={(v) => setPermissions({ ...permissions, dizimistas_view: v })} />
                    <PermissionToggle id="dizimistas_edit" testId="switch-dizimistas-edit" label="Editar / Criar / Excluir" checked={permissions.dizimistas_edit} onChange={(v) => setPermissions({ ...permissions, dizimistas_edit: v, dizimistas_view: v || permissions.dizimistas_view })} />
                  </PermissionGroup>

                  <PermissionGroup icon={DollarSign} label="Contribuições">
                    <PermissionToggle id="contribuicoes_view" label="Visualizar" checked={permissions.contribuicoes_view} onChange={(v) => setPermissions({ ...permissions, contribuicoes_view: v })} />
                    <PermissionToggle id="contribuicoes_edit" label="Editar / Criar / Excluir" checked={permissions.contribuicoes_edit} onChange={(v) => setPermissions({ ...permissions, contribuicoes_edit: v, contribuicoes_view: v || permissions.contribuicoes_view })} />
                  </PermissionGroup>

                  <PermissionGroup icon={FileText} label="Relatórios">
                    <PermissionToggle id="relatorios_view" testId="switch-relatorios-view" label="Visualizar" checked={permissions.relatorios_view} onChange={(v) => setPermissions({ ...permissions, relatorios_view: v })} />
                    <PermissionToggle id="relatorios_edit" testId="switch-relatorios-edit" label="Editar" checked={permissions.relatorios_edit} onChange={(v) => setPermissions({ ...permissions, relatorios_edit: v, relatorios_view: v || permissions.relatorios_view })} />
                  </PermissionGroup>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPermissionsDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleSavePermissions} data-testid="btn-salvar-permissoes">Salvar Permissões</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

const PermissionBadge = ({ edit, view }) => (
  <div className="flex gap-1">
    {edit ? <Badge className="badge-edit">Editar</Badge>
      : view ? <Badge className="badge-view">Visualizar</Badge>
        : <Badge variant="outline">Nenhum</Badge>}
  </div>
);

const PermissionGroup = ({ icon: Icon, label, children }) => (
  <div className="space-y-4">
    <h4 className="font-medium flex items-center gap-2">
      <Icon className="w-4 h-4" />
      {label}
    </h4>
    <div className="ml-6 space-y-3">{children}</div>
  </div>
);

const PermissionToggle = ({ id, label, checked, onChange, testId }) => (
  <div className="flex items-center justify-between">
    <Label htmlFor={id} className="cursor-pointer">{label}</Label>
    <Switch id={id} data-testid={testId} checked={checked} onCheckedChange={onChange} />
  </div>
);

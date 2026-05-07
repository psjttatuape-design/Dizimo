import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Plus, Edit, Trash2, Upload, Download, Printer, FileSpreadsheet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Layout } from "../components/layout/Layout";
import { useAuth } from "../contexts/AuthContext";
import { API } from "../lib/api";
import { MESES, formatDateBR } from "../constants/meses";

const EMPTY_FORM = {
  nome: "", telefone: "", telefone_residencial: "", email: "",
  logradouro: "", numero: "", complemento: "", cep: "",
  data_nascimento: "", estado_civil: "", nome_conjuge: "",
  co_dizimista: "", co_dizimista_aniversario: "",
  nota: "Novo", status: "Ativo",
  comunicacao: "", valor_dizimo: 0,
};

export default function DizimistasPage() {
  const [dizimistas, setDizimistas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [editingDizimista, setEditingDizimista] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [filtros, setFiltros] = useState({ nota: "", status: "", mes_aniversario: "", nome: "" });
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);
  const { hasPermission } = useAuth();

  useEffect(() => {
    fetchDizimistas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  const fetchDizimistas = async () => {
    try {
      let url = `${API}/dizimistas?`;
      if (filtros.nota && filtros.nota !== "todos") url += `nota=${filtros.nota}&`;
      if (filtros.status && filtros.status !== "todos") url += `status=${filtros.status}&`;
      if (filtros.mes_aniversario && filtros.mes_aniversario !== "todos") url += `mes_aniversario=${filtros.mes_aniversario}&`;
      if (filtros.nome) url += `nome=${encodeURIComponent(filtros.nome)}&`;

      const response = await axios.get(url);
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
      setFormData(EMPTY_FORM);
      fetchDizimistas();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao salvar");
    }
  };

  const handleEdit = (dizimista) => {
    setEditingDizimista(dizimista);
    setFormData({
      nome: dizimista.nome,
      telefone: dizimista.telefone || "",
      telefone_residencial: dizimista.telefone_residencial || "",
      email: dizimista.email || "",
      logradouro: dizimista.logradouro || dizimista.endereco || "",
      numero: dizimista.numero || "",
      complemento: dizimista.complemento || "",
      cep: dizimista.cep || "",
      data_nascimento: dizimista.data_nascimento || "",
      estado_civil: dizimista.estado_civil || "",
      nome_conjuge: dizimista.nome_conjuge || "",
      co_dizimista: dizimista.co_dizimista || "",
      co_dizimista_aniversario: dizimista.co_dizimista_aniversario || "",
      nota: dizimista.nota || "Novo",
      status: dizimista.status || "Ativo",
      comunicacao: dizimista.comunicacao || "",
      valor_dizimo: dizimista.valor_dizimo,
    });
    setDialogOpen(true);
  };

  const handleDeleteFromEdit = async () => {
    if (!editingDizimista) return;
    try {
      await axios.delete(`${API}/dizimistas/${editingDizimista.id}`);
      toast.success("Dizimista excluído!");
      setDialogOpen(false);
      setEditingDizimista(null);
      fetchDizimistas();
    } catch (error) {
      toast.error("Erro ao excluir");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/dizimistas/${id}`);
      toast.success("Dizimista excluído!");
      fetchDizimistas();
    } catch (error) {
      toast.error("Erro ao excluir");
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await axios.get(`${API}/dizimistas/template/excel`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_dizimistas.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Template baixado!");
    } catch (error) {
      toast.error("Erro ao baixar template");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const fd = new FormData();
    fd.append('file', file);

    try {
      const response = await axios.post(`${API}/dizimistas/import/excel`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(`${response.data.imported} dizimistas importados!`);
      if (response.data.errors?.length > 0) {
        toast.warning(`${response.data.errors.length} erros encontrados`);
      }
      setImportDialogOpen(false);
      fetchDizimistas();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao importar");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const exportList = async () => {
    try {
      let url = `${API}/dizimistas/export/excel?`;
      if (filtros.status && filtros.status !== "todos") url += `status=${filtros.status}&`;
      if (filtros.nota && filtros.nota !== "todos") url += `nota=${filtros.nota}&`;
      if (filtros.mes_aniversario && filtros.mes_aniversario !== "todos") url += `mes_aniversario=${filtros.mes_aniversario}&`;

      const response = await axios.get(url, { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', 'lista_dizimistas.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Lista exportada!");
    } catch (error) {
      toast.error("Erro ao exportar");
    }
  };

  const canEdit = hasPermission("dizimistas", "edit");

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dizimistas</h1>
            <p className="text-muted-foreground">Gerenciar membros dizimistas</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" data-testid="btn-excel-menu">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Excel
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Importar</DropdownMenuLabel>
                <DropdownMenuItem onClick={downloadTemplate} data-testid="btn-download-template">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Template
                </DropdownMenuItem>
                {canEdit && (
                  <DropdownMenuItem onClick={() => setImportDialogOpen(true)} data-testid="btn-import-excel">
                    <Upload className="w-4 h-4 mr-2" />
                    Importar Arquivo
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Exportar</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setExportDialogOpen(true)} data-testid="btn-export-excel">
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir Lista
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {canEdit && (
              <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingDizimista(null); setFormData(EMPTY_FORM); } }}>
                <DialogTrigger asChild>
                  <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90" data-testid="btn-novo-dizimista">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Dizimista
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
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
                        <Label htmlFor="co_dizimista">Co-Dizimista</Label>
                        <Input
                          id="co_dizimista"
                          data-testid="input-co-dizimista"
                          value={formData.co_dizimista}
                          onChange={(e) => setFormData({ ...formData, co_dizimista: e.target.value })}
                          placeholder="Nome do co-dizimista"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="co_dizimista_aniversario">Aniversário Co-Dizimista</Label>
                        <Input
                          id="co_dizimista_aniversario"
                          data-testid="input-co-dizimista-aniversario"
                          type="date"
                          value={formData.co_dizimista_aniversario}
                          onChange={(e) => setFormData({ ...formData, co_dizimista_aniversario: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="telefone">Celular</Label>
                        <Input id="telefone" data-testid="input-telefone" value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} placeholder="(11) 99999-9999" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefone_residencial">Tel. Residencial</Label>
                        <Input id="telefone_residencial" data-testid="input-telefone-res" value={formData.telefone_residencial} onChange={(e) => setFormData({ ...formData, telefone_residencial: e.target.value })} placeholder="(11) 2222-3333" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="data_nascimento">Data Nascimento</Label>
                        <Input id="data_nascimento" data-testid="input-nascimento" type="date" value={formData.data_nascimento} onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-6 space-y-2">
                        <Label htmlFor="logradouro">Logradouro</Label>
                        <Input id="logradouro" data-testid="input-logradouro" value={formData.logradouro} onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })} placeholder="Rua, Avenida..." />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="numero">Número</Label>
                        <Input id="numero" data-testid="input-numero" value={formData.numero} onChange={(e) => setFormData({ ...formData, numero: e.target.value })} />
                      </div>
                      <div className="col-span-4 space-y-2">
                        <Label htmlFor="complemento">Complemento</Label>
                        <Input id="complemento" data-testid="input-complemento" value={formData.complemento} onChange={(e) => setFormData({ ...formData, complemento: e.target.value })} placeholder="Apto, Bloco..." />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cep">CEP</Label>
                        <Input id="cep" data-testid="input-cep" value={formData.cep} onChange={(e) => setFormData({ ...formData, cep: e.target.value })} placeholder="00000-000" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" data-testid="input-email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="estado_civil">Estado Civil</Label>
                        <Select value={formData.estado_civil || "nenhum"} onValueChange={(v) => setFormData({ ...formData, estado_civil: v === "nenhum" ? "" : v, nome_conjuge: v !== "Casado" ? "" : formData.nome_conjuge })}>
                          <SelectTrigger data-testid="select-estado-civil">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nenhum">Selecione</SelectItem>
                            <SelectItem value="Solteiro">Solteiro</SelectItem>
                            <SelectItem value="Casado">Casado</SelectItem>
                            <SelectItem value="Outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {formData.estado_civil === "Casado" && (
                        <div className="space-y-2">
                          <Label htmlFor="nome_conjuge">Nome do Cônjuge</Label>
                          <Input id="nome_conjuge" data-testid="input-conjuge" value={formData.nome_conjuge} onChange={(e) => setFormData({ ...formData, nome_conjuge: e.target.value })} placeholder="Nome do cônjuge" />
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="comunicacao">Comunicação</Label>
                        <Select value={formData.comunicacao || "nenhum"} onValueChange={(v) => setFormData({ ...formData, comunicacao: v === "nenhum" ? "" : v })}>
                          <SelectTrigger data-testid="select-comunicacao">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nenhum">Selecione</SelectItem>
                            <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                            <SelectItem value="Correio">Correio</SelectItem>
                            <SelectItem value="E-mail">E-mail</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nota">Nota</Label>
                        <Select value={formData.nota} onValueChange={(v) => setFormData({ ...formData, nota: v })}>
                          <SelectTrigger data-testid="select-nota"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Novo">Novo</SelectItem>
                            <SelectItem value="Atualizar">Atualizar</SelectItem>
                            <SelectItem value="OK">OK</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                          <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Ativo">Ativo</SelectItem>
                            <SelectItem value="Pendente">Pendente</SelectItem>
                            <SelectItem value="Inativo">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter className="flex justify-between sm:justify-between">
                      {editingDizimista && (
                        <Button type="button" variant="destructive" onClick={handleDeleteFromEdit} data-testid="btn-deletar-dizimista">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </Button>
                      )}
                      <Button type="submit" data-testid="btn-salvar-dizimista">
                        {editingDizimista ? "Atualizar" : "Cadastrar"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap mb-4 p-4 bg-muted/30 rounded-lg">
          <Label className="text-sm text-muted-foreground whitespace-nowrap">Filtrar por:</Label>
          <Input placeholder="Buscar por nome..." value={filtros.nome} onChange={(e) => setFiltros({ ...filtros, nome: e.target.value })} className="w-[200px] bg-background" data-testid="filtro-nome-diz" />
          <Select value={filtros.status} onValueChange={(v) => setFiltros({ ...filtros, status: v })}>
            <SelectTrigger className="w-[130px] bg-background" data-testid="filtro-status-diz"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Status</SelectItem>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtros.nota} onValueChange={(v) => setFiltros({ ...filtros, nota: v })}>
            <SelectTrigger className="w-[130px] bg-background" data-testid="filtro-nota-diz"><SelectValue placeholder="Nota" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas Notas</SelectItem>
              <SelectItem value="Novo">Novo</SelectItem>
              <SelectItem value="Atualizar">Atualizar</SelectItem>
              <SelectItem value="OK">OK</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtros.mes_aniversario} onValueChange={(v) => setFiltros({ ...filtros, mes_aniversario: v })}>
            <SelectTrigger className="w-[150px] bg-background" data-testid="filtro-aniversario-diz"><SelectValue placeholder="Aniversário" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Meses</SelectItem>
              {MESES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {(filtros.status || filtros.nota || filtros.mes_aniversario || filtros.nome) &&
            (filtros.status !== "todos" || filtros.nota !== "todos" || filtros.mes_aniversario !== "todos" || filtros.nome) && (
              <Button variant="ghost" size="sm" onClick={() => setFiltros({ nota: "", status: "", mes_aniversario: "", nome: "" })}>
                Limpar
              </Button>
            )}
          <div className="ml-auto text-sm text-muted-foreground font-medium">
            {dizimistas.length} dizimista(s) encontrado(s)
          </div>
        </div>

        {/* Import Dialog */}
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Importar Dizimistas</DialogTitle>
              <DialogDescription>Selecione um arquivo Excel (.xlsx) com os dados dos dizimistas</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-4">Arraste o arquivo ou clique para selecionar</p>
                <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} ref={fileInputRef} className="hidden" id="file-upload" />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
                  {importing ? "Importando..." : "Selecionar Arquivo"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Não tem o template? <button onClick={downloadTemplate} className="text-primary underline">Baixe aqui</button>
              </p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Export Dialog */}
        <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Exportar Lista de Dizimistas</DialogTitle>
              <DialogDescription>A exportação usará os mesmos filtros aplicados na listagem atual</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Filtros ativos:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Status: {filtros.status && filtros.status !== "todos" ? filtros.status : "Todos"}</li>
                  <li>Nota: {filtros.nota && filtros.nota !== "todos" ? filtros.nota : "Todas"}</li>
                  <li>Aniversário: {filtros.mes_aniversario && filtros.mes_aniversario !== "todos"
                    ? MESES.find(m => m.value === filtros.mes_aniversario)?.label || "Todos"
                    : "Todos os meses"}</li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground">
                Total de {dizimistas.length} dizimista(s) será(ão) exportado(s).
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setExportDialogOpen(false)}>Cancelar</Button>
              <Button onClick={() => { exportList(); setExportDialogOpen(false); }} data-testid="btn-confirmar-export">
                <Download className="w-4 h-4 mr-2" />
                Exportar Excel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    {canEdit && <TableHead className="text-center">Editar</TableHead>}
                    <TableHead>Celular</TableHead>
                    <TableHead>Tel. Residencial</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Aniversário</TableHead>
                    <TableHead>Comunicação</TableHead>
                    <TableHead>Nota</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={canEdit ? 9 : 8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                  ) : dizimistas.length === 0 ? (
                    <TableRow><TableCell colSpan={canEdit ? 9 : 8} className="text-center py-8 text-muted-foreground">Nenhum dizimista cadastrado</TableCell></TableRow>
                  ) : (
                    dizimistas.map((dizimista) => (
                      <TableRow key={dizimista.id} data-testid={`row-dizimista-${dizimista.id}`}>
                        <TableCell className="font-medium">{dizimista.nome}</TableCell>
                        {canEdit && (
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(dizimista)} data-testid={`btn-edit-${dizimista.id}`}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(dizimista.id)} data-testid={`btn-delete-${dizimista.id}`}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                        <TableCell>{dizimista.telefone || "-"}</TableCell>
                        <TableCell>{dizimista.telefone_residencial || "-"}</TableCell>
                        <TableCell>{dizimista.email || "-"}</TableCell>
                        <TableCell>{formatDateBR(dizimista.data_nascimento)}</TableCell>
                        <TableCell>{dizimista.comunicacao || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            dizimista.nota === "OK" ? "bg-green-100 text-green-700 border-green-300" :
                              dizimista.nota === "Atualizar" ? "bg-amber-100 text-amber-700 border-amber-300" :
                                "bg-blue-100 text-blue-700 border-blue-300"
                          }>
                            {dizimista.nota || "Novo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            dizimista.status === "Ativo" ? "bg-green-100 text-green-700 border-green-300" :
                              dizimista.status === "Pendente" ? "bg-amber-100 text-amber-700 border-amber-300" :
                                "bg-red-100 text-red-700 border-red-300"
                          }>
                            {dizimista.status || "Ativo"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

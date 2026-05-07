import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Plus, Edit, Trash2, FileText, TrendingUp } from "lucide-react";

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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import { Layout } from "../components/layout/Layout";
import { useAuth } from "../contexts/AuthContext";
import { API } from "../lib/api";
import { MESES, formatCurrency, formatDateBR } from "../constants/meses";

const getDefaultFormData = () => {
  const hoje = new Date();
  return {
    dizimista_id: "",
    valor: "",
    data: hoje.toISOString().split('T')[0],
    mes_referencia: String(hoje.getMonth() + 1),
    meio: "",
  };
};

export default function ContribuicoesPage() {
  const [contribuicoes, setContribuicoes] = useState([]);
  const [dizimistas, setDizimistas] = useState([]);
  const [valoresMensais, setValoresMensais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContribuicao, setEditingContribuicao] = useState(null);
  const [showDetailedList, setShowDetailedList] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contribuicaoToDelete, setContribuicaoToDelete] = useState(null);
  const [dizimistaSearch, setDizimistaSearch] = useState("");
  const [dizimistaDropdownOpen, setDizimistaDropdownOpen] = useState(false);
  const [formData, setFormData] = useState(getDefaultFormData());
  const [filtros, setFiltros] = useState({ dizimista_id: "", mes_referencia: "", ano: "" });
  const { hasPermission, user } = useAuth();
  const isAdmin = user?.role === "admin";

  const filteredDizimistas = useMemo(() => {
    let result = dizimistas;
    if (dizimistaSearch) {
      result = dizimistas.filter(d => d.nome.toLowerCase().includes(dizimistaSearch.toLowerCase()));
    }
    return result.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [dizimistas, dizimistaSearch]);

  const selectedDizimistaName = useMemo(() => {
    if (!formData.dizimista_id) return "";
    const found = dizimistas.find(d => d.id === formData.dizimista_id);
    return found ? found.nome : "";
  }, [formData.dizimista_id, dizimistas]);

  const anoAtual = new Date().getFullYear();
  const anos = [anoAtual, anoAtual - 1, anoAtual - 2];

  const ultimos12Meses = useMemo(() => {
    const resultado = [];
    const hoje = new Date();
    for (let i = 0; i < 12; i++) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      resultado.push({
        mes: data.getMonth() + 1,
        ano: data.getFullYear(),
        label: `${MESES[data.getMonth()].label}/${data.getFullYear()}`,
      });
    }
    return resultado;
  }, []);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  const fetchData = async () => {
    try {
      const dizRes = await axios.get(`${API}/dizimistas`);
      setDizimistas(dizRes.data);

      const valoresRes = await axios.get(`${API}/valores-mensais`);
      setValoresMensais(valoresRes.data);

      let url = `${API}/contribuicoes?`;
      if (filtros.dizimista_id) url += `dizimista_id=${filtros.dizimista_id}&`;
      if (filtros.mes_referencia && filtros.mes_referencia !== "todos") url += `mes_referencia=${filtros.mes_referencia}&`;

      const contribRes = await axios.get(url);
      setContribuicoes(contribRes.data);
    } catch (error) {
      toast.error("Erro ao buscar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleSincronizar = async () => {
    setSyncing(true);
    try {
      const response = await axios.post(`${API}/contribuicoes/sincronizar-valores-mensais`);
      toast.success(response.data.message);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao sincronizar");
    } finally {
      setSyncing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.dizimista_id) { toast.error("Selecione um dizimista"); return; }
    if (!formData.valor || parseFloat(formData.valor) <= 0) { toast.error("Informe um valor válido"); return; }

    try {
      const payload = { ...formData, valor: parseFloat(formData.valor) || 0 };
      if (editingContribuicao) {
        await axios.put(`${API}/contribuicoes/${editingContribuicao.id}`, payload);
        toast.success("Contribuição atualizada!");
      } else {
        await axios.post(`${API}/contribuicoes`, payload);
        toast.success("Contribuição registrada!");
      }
      setDialogOpen(false);
      setEditingContribuicao(null);
      setFormData(getDefaultFormData());
      setDizimistaSearch("");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao salvar");
    }
  };

  const handleEdit = (contrib) => {
    setEditingContribuicao(contrib);
    setFormData({
      dizimista_id: contrib.dizimista_id,
      valor: contrib.valor.toString(),
      data: contrib.data?.split("T")[0] || "",
      mes_referencia: contrib.mes_referencia || "",
      meio: contrib.meio || "",
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (contrib) => {
    setContribuicaoToDelete(contrib);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!contribuicaoToDelete) return;
    try {
      await axios.delete(`${API}/contribuicoes/${contribuicaoToDelete.id}`);
      toast.success("Contribuição excluída!");
      fetchData();
    } catch (error) {
      toast.error("Erro ao excluir");
    } finally {
      setDeleteDialogOpen(false);
      setContribuicaoToDelete(null);
    }
  };

  const canEdit = hasPermission("dizimistas", "edit");
  const totalContribuicoes = contribuicoes.reduce((sum, c) => sum + (c.valor || 0), 0);

  const valoresMensaisMap = valoresMensais.reduce((acc, v) => {
    acc[`${v.mes}-${v.ano}`] = { valor: v.valor, mes: v.mes, ano: v.ano };
    return acc;
  }, {});

  const totalUltimos12Meses = ultimos12Meses.reduce((sum, item) => {
    return sum + (valoresMensaisMap[`${item.mes}-${item.ano}`]?.valor || 0);
  }, 0);

  const totalContribUltimos12 = contribuicoes.filter(c => {
    if (!c.mes_referencia || !c.data) return false;
    const ano = parseInt(c.data.substring(0, 4));
    const mes = parseInt(c.mes_referencia);
    return ultimos12Meses.some(u => u.mes === mes && u.ano === ano);
  }).length;

  return (
    <Layout>
      <div className="page-container">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contribuições</h1>
            <p className="text-muted-foreground">Gerenciar contribuições dos dizimistas</p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button variant="outline" onClick={handleSincronizar} disabled={syncing}>
                <TrendingUp className="w-4 h-4 mr-2" />
                {syncing ? "Sincronizando..." : "Atualizar Relatório"}
              </Button>
            )}
            {isAdmin && (
              <Button variant={showDetailedList ? "default" : "outline"} onClick={() => setShowDetailedList(!showDetailedList)}>
                <FileText className="w-4 h-4 mr-2" />
                {showDetailedList ? "Ocultar Lista" : "Ver Lista Detalhada"}
              </Button>
            )}
            {canEdit && (
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) {
                  setEditingContribuicao(null);
                  setFormData(getDefaultFormData());
                  setDizimistaSearch("");
                  setDizimistaDropdownOpen(false);
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Contribuição
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editingContribuicao ? "Editar Contribuição" : "Nova Contribuição"}</DialogTitle>
                    <DialogDescription>Registre uma contribuição de dízimo</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="dizimista_id">Dizimista *</Label>
                      <div className="relative">
                        <Input
                          placeholder="Digite para buscar dizimista..."
                          value={editingContribuicao ? selectedDizimistaName : dizimistaSearch || selectedDizimistaName}
                          onChange={(e) => {
                            setDizimistaSearch(e.target.value);
                            setDizimistaDropdownOpen(true);
                            if (!e.target.value) setFormData({ ...formData, dizimista_id: "" });
                          }}
                          onFocus={() => setDizimistaDropdownOpen(true)}
                          disabled={!!editingContribuicao}
                          className="w-full"
                        />
                        {dizimistaDropdownOpen && !editingContribuicao && filteredDizimistas.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                            {filteredDizimistas.slice(0, 50).map(d => (
                              <div
                                key={d.id}
                                className="px-3 py-2 cursor-pointer hover:bg-muted transition-colors"
                                onClick={() => {
                                  setFormData({ ...formData, dizimista_id: d.id });
                                  setDizimistaSearch(d.nome);
                                  setDizimistaDropdownOpen(false);
                                }}
                              >
                                {d.nome}
                              </div>
                            ))}
                          </div>
                        )}
                        {dizimistaDropdownOpen && !editingContribuicao && dizimistaSearch && filteredDizimistas.length === 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg p-3 text-muted-foreground">
                            Nenhum dizimista encontrado
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="valor">Valor (R$) *</Label>
                        <Input id="valor" type="number" step="0.01" value={formData.valor} onChange={(e) => setFormData({ ...formData, valor: e.target.value })} placeholder="0,00" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="data">Data</Label>
                        <Input id="data" type="date" value={formData.data} onChange={(e) => setFormData({ ...formData, data: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mes_referencia">Mês de Referência</Label>
                      <Select value={formData.mes_referencia || "nenhum"} onValueChange={(v) => setFormData({ ...formData, mes_referencia: v === "nenhum" ? "" : v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nenhum">Selecione</SelectItem>
                          {MESES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="meio">Meio</Label>
                      <Select value={formData.meio || "nenhum"} onValueChange={(v) => setFormData({ ...formData, meio: v === "nenhum" ? "" : v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nenhum">Selecione</SelectItem>
                          <SelectItem value="Envelope">Envelope</SelectItem>
                          <SelectItem value="Pix/Depósito">Pix/Depósito</SelectItem>
                          <SelectItem value="Presencial">Presencial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button type="submit">{editingContribuicao ? "Atualizar" : "Registrar"}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total de Registros</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{contribuicoes.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Valor Total</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{formatCurrency(totalContribuicoes)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Dizimistas Cadastrados</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{dizimistas.length}</div></CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex items-center gap-4 flex-wrap">
              <Label className="text-sm text-muted-foreground whitespace-nowrap">Filtrar por:</Label>
              <Select value={filtros.mes_referencia} onValueChange={(v) => setFiltros({ ...filtros, mes_referencia: v })}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Mês" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Meses</SelectItem>
                  {MESES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filtros.ano} onValueChange={(v) => setFiltros({ ...filtros, ano: v })}>
                <SelectTrigger className="w-[120px]"><SelectValue placeholder="Ano" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {anos.map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
              {((filtros.mes_referencia && filtros.mes_referencia !== "todos") || (filtros.ano && filtros.ano !== "todos")) && (
                <Button variant="ghost" size="sm" onClick={() => setFiltros({ dizimista_id: "", mes_referencia: "", ano: "" })}>Limpar</Button>
              )}
              <div className="ml-auto text-sm text-muted-foreground">
                {contribuicoes.length} contribuição(ões) encontrada(s)
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Últimos 12 Meses</CardTitle>
            <CardDescription>Valores registrados no relatório de contribuições mensais</CardDescription>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês/Ano</TableHead>
                <TableHead className="text-center">Contrib. Registradas</TableHead>
                <TableHead className="text-right">Valor no Relatório</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : (
                <>
                  {ultimos12Meses.map((item) => {
                    const key = `${item.mes}-${item.ano}`;
                    const valorRelatorio = valoresMensaisMap[key]?.valor || 0;
                    const contribCount = contribuicoes.filter(c => {
                      if (!c.data) return false;
                      const contribAno = parseInt(c.data.substring(0, 4));
                      const contribMes = parseInt(c.mes_referencia || "0");
                      return contribMes === item.mes && contribAno === item.ano;
                    }).length;
                    return (
                      <TableRow key={key}>
                        <TableCell className="font-medium">{item.label}</TableCell>
                        <TableCell className="text-center">{contribCount}</TableCell>
                        <TableCell className="text-right font-semibold text-green-600">{formatCurrency(valorRelatorio)}</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>TOTAL (12 MESES)</TableCell>
                    <TableCell className="text-center">{totalContribUltimos12}</TableCell>
                    <TableCell className="text-right text-green-700">{formatCurrency(totalUltimos12Meses)}</TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </Card>

        {isAdmin && showDetailedList && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Lista Detalhada de Contribuições
              </CardTitle>
              <CardDescription>Visualização completa com filtros (apenas administradores)</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <Label className="text-sm text-muted-foreground whitespace-nowrap">Filtrar por:</Label>
                <Select value={filtros.mes_referencia || "todos"} onValueChange={(v) => setFiltros({ ...filtros, mes_referencia: v === "todos" ? "" : v })}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Mês Ref." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Meses</SelectItem>
                    {MESES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filtros.dizimista_id || "todos"} onValueChange={(v) => setFiltros({ ...filtros, dizimista_id: v === "todos" ? "" : v })}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="Dizimista" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Dizimistas</SelectItem>
                    {[...dizimistas].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(filtros.mes_referencia || filtros.dizimista_id) && (
                  <Button variant="ghost" size="sm" onClick={() => setFiltros({ dizimista_id: "", mes_referencia: "" })}>
                    Limpar Filtros
                  </Button>
                )}
              </div>
            </CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dizimista</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Mês Ref.</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Meio</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contribuicoes.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma contribuição encontrada</TableCell></TableRow>
                ) : (
                  contribuicoes.map((contrib) => (
                    <TableRow key={contrib.id}>
                      <TableCell className="font-medium">{contrib.dizimista_nome || "—"}</TableCell>
                      <TableCell>{formatDateBR(contrib.data)}</TableCell>
                      <TableCell>{contrib.mes_referencia ? MESES.find(m => m.value === contrib.mes_referencia)?.label || contrib.mes_referencia : "—"}</TableCell>
                      <TableCell className="font-semibold text-green-600">{formatCurrency(contrib.valor)}</TableCell>
                      <TableCell>{contrib.meio || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(contrib)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(contrib)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        )}

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" />
                Confirmar Exclusão
              </DialogTitle>
              <DialogDescription className="pt-2">
                Tem certeza que deseja excluir esta contribuição?
                {contribuicaoToDelete && (
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <p><strong>Dizimista:</strong> {contribuicaoToDelete.dizimista_nome}</p>
                    <p><strong>Valor:</strong> {formatCurrency(contribuicaoToDelete.valor)}</p>
                    <p><strong>Data:</strong> {formatDateBR(contribuicaoToDelete.data)}</p>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={confirmDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  Users, DollarSign, TrendingUp, UserCheck, Calendar, BarChart3,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { Layout } from "../components/layout/Layout";
import { useAuth } from "../contexts/AuthContext";
import { API } from "../lib/api";
import { MESES, formatCurrency } from "../constants/meses";

export default function PainelGeral() {
  const [stats, setStats] = useState(null);
  const [dizimistas, setDizimistas] = useState([]);
  const [valoresMensais, setValoresMensais] = useState([]);
  const [contribuicoes, setContribuicoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ nota: "", status: "", mes_contribuicao: "" });
  const { hasPermission } = useAuth();

  const currentYear = new Date().getFullYear();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const statsRes = await axios.get(`${API}/relatorios/resumo`);
      setStats(statsRes.data);

      const valoresRes = await axios.get(`${API}/valores-mensais`);
      setValoresMensais(valoresRes.data);

      const contribRes = await axios.get(`${API}/contribuicoes`);
      setContribuicoes(contribRes.data);

      const allDizRes = await axios.get(`${API}/dizimistas`);

      let filteredDizimistas = allDizRes.data;
      if (filtros.nota && filtros.nota !== "todos") {
        filteredDizimistas = filteredDizimistas.filter(d => d.nota === filtros.nota);
      }
      if (filtros.status && filtros.status !== "todos") {
        filteredDizimistas = filteredDizimistas.filter(d => d.status === filtros.status);
      }
      if (filtros.mes_contribuicao && filtros.mes_contribuicao !== "todos") {
        filteredDizimistas = filteredDizimistas.filter(d => d.mes_contribuicao === filtros.mes_contribuicao);
      }
      setDizimistas(filteredDizimistas);
    } catch (error) {
      // silently
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    if (hasPermission("relatorios", "view")) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [fetchData, hasPermission]);

  const temFiltrosAtivos = (filtros.nota && filtros.nota !== "todos") ||
    (filtros.status && filtros.status !== "todos") ||
    (filtros.mes_contribuicao && filtros.mes_contribuicao !== "todos");

  const contributionCount = dizimistas.length;

  const totalAnoAtual = valoresMensais
    .filter(v => v.ano === currentYear)
    .reduce((sum, v) => sum + (v.valor || 0), 0);

  const contribuicoesAnoAtual = contribuicoes.filter(c => {
    if (!c.data) return false;
    return parseInt(c.data.substring(0, 4)) === currentYear;
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel Geral</h1>
          <p className="text-muted-foreground">Visão geral do sistema de dízimos</p>
        </div>

        {hasPermission("relatorios", "view") ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="animate-fade-in" data-testid="card-total">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Dizimistas</CardTitle>
                  <Users className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{loading ? "-" : stats?.total_dizimistas || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Cadastrados no sistema</p>
                </CardContent>
              </Card>

              <Card className="animate-fade-in animate-delay-100" data-testid="card-ativos">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Ativos</CardTitle>
                  <UserCheck className="w-4 h-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{loading ? "-" : stats?.dizimistas_ativos || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Contribuindo regularmente</p>
                </CardContent>
              </Card>

              <Card className="animate-fade-in animate-delay-200" data-testid="card-pendentes">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
                  <Calendar className="w-4 h-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">{loading ? "-" : stats?.dizimistas_pendentes || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Aguardando contribuição</p>
                </CardContent>
              </Card>

              <Card className="animate-fade-in animate-delay-300" data-testid="card-inativos">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Inativos</CardTitle>
                  <Users className="w-4 h-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{loading ? "-" : stats?.dizimistas_inativos || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Sem contribuição recente</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="animate-fade-in" data-testid="card-arrecadado">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Arrecadado ({currentYear})</CardTitle>
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{loading ? "-" : formatCurrency(totalAnoAtual)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Soma do ano</p>
                </CardContent>
              </Card>

              <Card className="animate-fade-in animate-delay-100" data-testid="card-contribuicoes">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Contribuições Registradas ({currentYear})</CardTitle>
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{loading ? "-" : contribuicoesAnoAtual.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Registros do ano atual</p>
                </CardContent>
              </Card>
            </div>

            <Card data-testid="card-filtros-dashboard">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Filtros de Dizimistas
                    </CardTitle>
                    <CardDescription>Filtre por nota, status ou mês de contribuição</CardDescription>
                  </div>
                  {temFiltrosAtivos && (
                    <Button variant="ghost" size="sm" onClick={() => setFiltros({ nota: "", status: "", mes_contribuicao: "" })}>
                      Limpar Filtros
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground whitespace-nowrap">Filtrar por:</Label>
                  </div>
                  <Select value={filtros.status} onValueChange={(v) => setFiltros({ ...filtros, status: v })}>
                    <SelectTrigger className="w-[130px]" data-testid="filtro-status-dash">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos Status</SelectItem>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filtros.nota} onValueChange={(v) => setFiltros({ ...filtros, nota: v })}>
                    <SelectTrigger className="w-[130px]" data-testid="filtro-nota-dash">
                      <SelectValue placeholder="Nota" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas Notas</SelectItem>
                      <SelectItem value="Novo">Novo</SelectItem>
                      <SelectItem value="Atualizar">Atualizar</SelectItem>
                      <SelectItem value="OK">OK</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filtros.mes_contribuicao} onValueChange={(v) => setFiltros({ ...filtros, mes_contribuicao: v })}>
                    <SelectTrigger className="w-[180px]" data-testid="filtro-mes-dash">
                      <SelectValue placeholder="Mês Contribuição" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Meses</SelectItem>
                      {MESES.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="mt-6 bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Dizimistas encontrados</p>
                      <p className="text-3xl font-bold">{loading ? "-" : contributionCount}</p>
                    </div>
                    {temFiltrosAtivos && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Filtros aplicados:</p>
                        <div className="flex gap-2 mt-1">
                          {filtros.status && filtros.status !== "todos" && <Badge variant="outline">{filtros.status}</Badge>}
                          {filtros.nota && filtros.nota !== "todos" && <Badge variant="outline">{filtros.nota}</Badge>}
                          {filtros.mes_contribuicao && filtros.mes_contribuicao !== "todos" && (
                            <Badge variant="outline">{MESES.find(m => m.value === filtros.mes_contribuicao)?.label}</Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
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
}

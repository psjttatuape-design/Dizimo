import { useEffect, useState } from "react";
import axios from "axios";
import { BarChart3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import { Layout } from "../components/layout/Layout";
import { useAuth } from "../contexts/AuthContext";
import { API } from "../lib/api";
import { MESES, formatCurrency, formatDateBR } from "../constants/meses";

export default function RelatoriosPage() {
  const [resumo, setResumo] = useState(null);
  const [contribuicoes, setContribuicoes] = useState([]);
  const [valoresMensais, setValoresMensais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    mesInicio: "", anoInicio: "", mesFim: "", anoFim: "", status: "", nota: "",
  });
  // useAuth hook is invoked to keep the route guarded; permissions are handled in protected route
  useAuth();

  const currentYear = new Date().getFullYear();
  const anos = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const totalAnoAtual = valoresMensais
    .filter(v => v.ano === currentYear)
    .reduce((sum, v) => sum + (v.valor || 0), 0);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchResumoEContribuicoes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  const fetchData = async () => {
    try {
      const valoresRes = await axios.get(`${API}/valores-mensais`);
      setValoresMensais(valoresRes.data);
      await fetchResumoEContribuicoes();
    } catch (error) {
      // silently
    } finally {
      setLoading(false);
    }
  };

  const fetchResumoEContribuicoes = async () => {
    try {
      let baseParams = "";
      if (filtros.mesInicio) baseParams += `mes_inicio=${filtros.mesInicio}&`;
      if (filtros.anoInicio) baseParams += `ano_inicio=${filtros.anoInicio}&`;
      if (filtros.mesFim) baseParams += `mes_fim=${filtros.mesFim}&`;
      if (filtros.anoFim) baseParams += `ano_fim=${filtros.anoFim}&`;
      if (filtros.status && filtros.status !== "todos") baseParams += `status=${filtros.status}&`;
      if (filtros.nota && filtros.nota !== "todos") baseParams += `nota=${filtros.nota}&`;

      const [resumoRes, contribRes] = await Promise.all([
        axios.get(`${API}/relatorios/resumo?${baseParams}`),
        axios.get(`${API}/relatorios/contribuicoes?${baseParams}`),
      ]);
      setResumo(resumoRes.data);
      setContribuicoes(contribRes.data);
    } catch (error) {
      // silently
    }
  };

  const limparFiltros = () => setFiltros({ mesInicio: "", anoInicio: "", mesFim: "", anoFim: "", status: "", nota: "" });

  const temFiltrosAtivos = filtros.mesInicio || filtros.anoInicio || filtros.mesFim || filtros.anoFim ||
    (filtros.status && filtros.status !== "todos") || (filtros.nota && filtros.nota !== "todos");

  const prepareChartData = () => {
    if (!resumo?.por_mes) return { data: [], media: 0 };
    const data = [];
    const today = new Date();
    let total = 0;
    let count = 0;

    for (let i = 14; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const mesNome = MESES[date.getMonth()].label.substring(0, 3);
      const valor = resumo.por_mes[key] || 0;
      if (valor > 0) { total += valor; count++; }
      data.push({
        mes: `${mesNome}/${date.getFullYear().toString().slice(-2)}`,
        valor,
        mesCompleto: `${MESES[date.getMonth()].label} ${date.getFullYear()}`,
      });
    }

    const media = count > 0 ? total / count : 0;
    data.forEach(d => { d.media = media; });
    return { data, media };
  };

  const { data: chartData, media: mediaArrecadacao } = prepareChartData();

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border rounded-lg shadow-lg p-3">
          <p className="font-medium">{payload[0].payload.mesCompleto}</p>
          <p className="text-primary font-bold">{formatCurrency(payload[0].value)}</p>
          {payload[1] && (
            <p className="text-muted-foreground text-sm">Média: {formatCurrency(payload[1].value)}</p>
          )}
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
        </div>

        <div className="bento-grid">
          <Card data-testid="card-total-dizimistas">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Dizimistas</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loading ? "-" : resumo?.total_dizimistas || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">{resumo?.dizimistas_ativos || 0} ativos</p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-arrecadado">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Arrecadado ({currentYear})</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loading ? "-" : formatCurrency(totalAnoAtual)}</div>
              <p className="text-xs text-muted-foreground mt-1">Soma das contribuições do ano</p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-contribuicoes">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Contribuições</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loading ? "-" : resumo?.total_contribuicoes || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Registros no sistema</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bento-card-wide" data-testid="card-grafico">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Contribuições Mensais
            </CardTitle>
            <CardDescription>
              Últimos 15 meses de arrecadação {mediaArrecadacao > 0 && `• Média: ${formatCurrency(mediaArrecadacao)}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">Carregando...</div>
            ) : chartData.length > 0 ? (
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="valor" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Arrecadado" />
                    <Line type="monotone" dataKey="media" stroke="#6b9e6b" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Média" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">Nenhum dado disponível</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Histórico de Contribuições</CardTitle>
                  <CardDescription>Filtre por período, status ou nota dos dizimistas</CardDescription>
                </div>
                {temFiltrosAtivos && <Button variant="ghost" size="sm" onClick={limparFiltros}>Limpar Filtros</Button>}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                <FilterSelect label="Mês Início" value={filtros.mesInicio} onChange={(v) => setFiltros({ ...filtros, mesInicio: v })} options={[{ value: "todos", label: "Todos" }, ...MESES]} testId="filtro-mes-inicio" />
                <FilterSelect label="Ano Início" value={filtros.anoInicio} onChange={(v) => setFiltros({ ...filtros, anoInicio: v })} options={[{ value: "todos", label: "Todos" }, ...anos.map(a => ({ value: String(a), label: String(a) }))]} testId="filtro-ano-inicio" />
                <FilterSelect label="Mês Fim" value={filtros.mesFim} onChange={(v) => setFiltros({ ...filtros, mesFim: v })} options={[{ value: "todos", label: "Todos" }, ...MESES]} testId="filtro-mes-fim" />
                <FilterSelect label="Ano Fim" value={filtros.anoFim} onChange={(v) => setFiltros({ ...filtros, anoFim: v })} options={[{ value: "todos", label: "Todos" }, ...anos.map(a => ({ value: String(a), label: String(a) }))]} testId="filtro-ano-fim" />
                <FilterSelect label="Status" value={filtros.status} onChange={(v) => setFiltros({ ...filtros, status: v })} options={[{ value: "todos", label: "Todos" }, { value: "Ativo", label: "Ativo" }, { value: "Pendente", label: "Pendente" }, { value: "Inativo", label: "Inativo" }]} testId="filtro-status" />
                <FilterSelect label="Nota" value={filtros.nota} onChange={(v) => setFiltros({ ...filtros, nota: v })} options={[{ value: "todos", label: "Todas" }, { value: "Novo", label: "Novo" }, { value: "Atualizar", label: "Atualizar" }, { value: "OK", label: "OK" }]} testId="filtro-nota" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dizimista</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Nota</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : contribuicoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma contribuição {temFiltrosAtivos ? "encontrada para os filtros selecionados" : "registrada"}
                    </TableCell>
                  </TableRow>
                ) : (
                  contribuicoes.map((contrib) => (
                    <TableRow key={contrib.id}>
                      <TableCell className="font-medium">{contrib.dizimista_nome}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          contrib.dizimista_status === "Ativo" ? "bg-green-100 text-green-700 border-green-300" :
                            contrib.dizimista_status === "Pendente" ? "bg-amber-100 text-amber-700 border-amber-300" :
                              "bg-red-100 text-red-700 border-red-300"
                        }>
                          {contrib.dizimista_status || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          contrib.dizimista_nota === "OK" ? "bg-green-100 text-green-700 border-green-300" :
                            contrib.dizimista_nota === "Atualizar" ? "bg-amber-100 text-amber-700 border-amber-300" :
                              "bg-blue-100 text-blue-700 border-blue-300"
                        }>
                          {contrib.dizimista_nota || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(contrib.valor)}</TableCell>
                      <TableCell>{formatDateBR(contrib.data)}</TableCell>
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
}

const FilterSelect = ({ label, value, onChange, options, testId }) => (
  <div className="space-y-1">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9" data-testid={testId}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {options.map(opt => (
          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

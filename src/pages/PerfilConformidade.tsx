import { useParams, useNavigate } from 'react-router-dom';
import { useIntegranteDossie } from '../hooks/useIntegranteDossie';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { DateHelper } from '../lib/dateHelper';
import { ModalGerenciarTreinamento } from '../components/rh/ModalGerenciarTreinamento';
import { exportarParaExcel } from '../utils';
import { 
  Car, GraduationCap, HeartPulse, ArrowLeft, 
  UploadCloud, FileText, BellRing, Calendar, Plus, Save,
  AlertTriangle, ShieldAlert, Download
} from 'lucide-react';
import { useState, useMemo } from 'react';
import clsx from 'clsx';
import { toast } from 'sonner';

// 🧠 MOTOR INTELIGENTE DE REGRAS (REGEX)
// Ignora espaços, traços, acentos, maiúsculas e minúsculas.
const REGRAS_SSMA = {
  nr11: (n: string) => /nr[-_\s]?11/i.test(n),
  nr35: (n: string) => /nr[-_\s]?35/i.test(n),
  direcaoDefensiva: (n: string) => /dire[cç][aã]o\s*defensiva/i.test(n),
  epi: (n: string) => /epi|equipamento\s*de\s*prote[cç][aã]o/i.test(n),
  lideranca: (n: string) => /lideran[cç]a/i.test(n),
  integracao: (n: string) => /integra[cç][aã]o/i.test(n),
  riscos: (n: string) => /risco/i.test(n),
};

// 🧠 DICIONÁRIO DE REQUISITOS SSMA POR CARGO
const DICIONARIO_REQUISITOS: Record<string, { id: string, display: string, check: (nome: string) => boolean }[]> = {
  'OPERADOR': [
    { id: 'req-nr11', display: 'NR-11 Operação de Poliguindaste', check: REGRAS_SSMA.nr11 },
    { id: 'req-nr35', display: 'NR-35 Trabalho em Altura', check: REGRAS_SSMA.nr35 },
    { id: 'req-dir', display: 'Direção Defensiva', check: REGRAS_SSMA.direcaoDefensiva },
  ],
  'AUXILIAR_OPERACIONAL': [
    { id: 'req-nr11', display: 'NR-11 Movimentação de Carga', check: REGRAS_SSMA.nr11 },
    { id: 'req-epi', display: 'Treinamento de EPI', check: REGRAS_SSMA.epi },
  ],
  'ENCARREGADO': [
    { id: 'req-nr11', display: 'NR-11 Movimentação de Carga', check: REGRAS_SSMA.nr11 },
    { id: 'req-nr35', display: 'NR-35 Trabalho em Altura', check: REGRAS_SSMA.nr35 },
    { id: 'req-lid', display: 'Liderança em SSMA', check: REGRAS_SSMA.lideranca },
  ],
  'ADMIN': [
    { id: 'req-int', display: 'Integração SSMA', check: REGRAS_SSMA.integracao },
  ],
  'RH': [
    { id: 'req-int', display: 'Integração SSMA', check: REGRAS_SSMA.integracao },
  ],
  'COORDENADOR': [
    { id: 'req-int', display: 'Integração SSMA', check: REGRAS_SSMA.integracao },
    { id: 'req-risc', display: 'Gestão de Riscos', check: REGRAS_SSMA.riscos },
  ],
};

export function PerfilConformidade() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: dossie, isLoading, refetch } = useIntegranteDossie(id || '');

  const [activeTab, setActiveTab] = useState<'treinamentos' | 'aso' | 'cnh'>('treinamentos');
  
  // Estados do Modal de Treinamentos
  const [isModalNROpen, setIsModalNROpen] = useState(false);
  const [treinamentoPreDefinido, setTreinamentoPreDefinido] = useState<string>('');

  // 🧠 CRUZAMENTO INTELIGENTE (Fuzzy Matching)
  const matrizTreinamentos = useMemo(() => {
    if (!dossie) return [];
    
    const realizados = dossie.user.treinamentos || [];
    const exigidos = DICIONARIO_REQUISITOS[dossie.user.role] || [];
    const hoje = new Date();

    const matrizProcessada: any[] = [];
    const treinamentosUtilizados = new Set<string>(); // Evita duplicar cursos

    // 1. Processa os requisitos obrigatórios do cargo
    exigidos.forEach(req => {
      // Usa o Regex (check) para encontrar qual certificado do integrante atende a este requisito
      const encontrados = realizados.filter(t => req.check(t.nome));
      
      if (encontrados.length > 0) {
        // Se o integrante tiver vários, ordena para usar a mais recente
        encontrados.sort((a, b) => {
          if (!a.dataVencimento) return -1;
          if (!b.dataVencimento) return 1;
          return new Date(b.dataVencimento).getTime() - new Date(a.dataVencimento).getTime();
        });
        
        const principal = encontrados[0];
        treinamentosUtilizados.add(principal.id); // Marca como usado
        
        let status = 'VÁLIDO';
        if (principal.dataVencimento) {
          const vencimento = new Date(principal.dataVencimento);
          const diasRestantes = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
          const alertaDias = (principal as any).diasAntecedenciaAlerta || 30;
          
          if (diasRestantes < 0) status = 'VENCIDO';
          else if (diasRestantes <= alertaDias) status = 'VENCENDO';
        }
        
        matrizProcessada.push({ ...principal, nomeExigido: req.display, status, isExtra: false });
      } else {
        // Se o Regex não encontrou nada parecido, é FALTANTE
        matrizProcessada.push({ id: req.id, nome: req.display, nomeExigido: req.display, status: 'FALTANTE', isExtra: false });
      }
    });

    // 2. Processa os "Extras" (Cursos que ele tem e que não foram sugados pelas regras acima)
    realizados.forEach(t => {
      if (!treinamentosUtilizados.has(t.id)) {
        let status = 'VÁLIDO';
        if (t.dataVencimento) {
          const vencimento = new Date(t.dataVencimento);
          const diasRestantes = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
          if (diasRestantes < 0) status = 'VENCIDO';
          else if (diasRestantes <= ((t as any).diasAntecedenciaAlerta || 30)) status = 'VENCENDO';
        }
        matrizProcessada.push({ ...t, status, isExtra: true });
      }
    });

    return matrizProcessada;
  }, [dossie]);

  if (isLoading || !dossie) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center animate-in fade-in">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-text-muted font-bold">A carregar dossiê de conformidade...</p>
      </div>
    );
  }

  const { user } = dossie;
  const isOperador = user.role === 'OPERADOR';

  if (!isOperador && activeTab === 'cnh') setActiveTab('treinamentos');

  const handleFakeUpload = () => {
    toast.info("A preparar conexão com o Cloudflare R2...");
  };

  const abrirModalParaPendencia = (nomeTreinamento: string) => {
    setTreinamentoPreDefinido(nomeTreinamento);
    setIsModalNROpen(true);
  };

  const abrirModalLivre = () => {
    setTreinamentoPreDefinido('');
    setIsModalNROpen(true);
  };

  // 📊 EXPORTAR EXCEL INDIVIDUAL
  const handleExportarIndividual = () => {
    if (matrizTreinamentos.length === 0) return;

    const promessa = new Promise((resolve) => {
      const dados = matrizTreinamentos.map(t => ({
        'Treinamento / NR': t.nomeExigido || t.nome,
        'Tipo': (t as any).isExtra ? 'Extra' : 'Obrigatório',
        'Status': t.status,
        'Vencimento': (t as any).dataVencimento ? DateHelper.getCompleta((t as any).dataVencimento) : 'Sem Vencimento'
      }));

      const nomeFicheiro = `Conformidade_${user.nome.replace(/\s+/g, '_')}.xlsx`;
      exportarParaExcel(dados, nomeFicheiro);
      resolve(true);
    });

    toast.promise(promessa, { 
      loading: 'A gerar relatório...', 
      success: 'Dossiê exportado com sucesso!', 
      error: 'Erro na exportação.' 
    });
  };

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-bold text-text-secondary hover:text-primary transition-colors w-fit"
      >
        <span className="p-1.5 bg-surface-hover border border-border/60 rounded-lg">
          <ArrowLeft className="w-4 h-4" />
        </span>
        Voltar à Matriz de Qualificação
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* PAINEL LATERAL (CONTEXTO DO INTEGRANTE) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface p-8 rounded-3xl border border-border/60 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-surface-hover border-b border-border/60" />
            
            <Avatar 
              nome={user.nome} 
              url={user.fotoUrl || (user as any).image} 
              size="2xl" 
              className="w-32 h-32 mb-5 shadow-md border-4 border-surface z-10 relative" 
            />
            <h2 className="text-xl font-black text-text-main tracking-tight leading-tight">{user.nome}</h2>
            <p className="text-text-secondary font-medium mt-1 mb-4">ID: {user.matricula || 'Sem Matrícula'}</p>
            <Badge variant={user.status === 'ATIVO' ? 'success' : 'neutral'} className="mb-6 w-full max-w-[140px] justify-center">
              {user.status || 'ATIVO'}
            </Badge>
            
            <div className="w-full pt-5 border-t border-dashed border-border/60">
              <p className="text-[11px] text-text-muted font-bold uppercase tracking-widest mb-1.5">Cargo Operacional</p>
              <div className="bg-primary/10 text-primary py-2 px-4 rounded-xl font-black text-sm border border-primary/20">
                {user.role.replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>

        {/* ÁREA PRINCIPAL (TRINCHEIRAS DE SSMA) */}
        <div className="lg:col-span-8 flex flex-col h-full">
          <div className="bg-surface p-2 rounded-2xl border border-border/60 shadow-sm flex gap-2 overflow-x-auto hide-scrollbar mb-6 shrink-0">
            <button 
              onClick={() => setActiveTab('treinamentos')}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all whitespace-nowrap",
                activeTab === 'treinamentos' ? "bg-primary text-white shadow-md" : "text-text-secondary hover:bg-surface-hover"
              )}
            >
              <GraduationCap className="w-4 h-4" /> NRs & Certificados
            </button>
            <button 
              onClick={() => setActiveTab('aso')}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all whitespace-nowrap",
                activeTab === 'aso' ? "bg-primary text-white shadow-md" : "text-text-secondary hover:bg-surface-hover"
              )}
            >
              <HeartPulse className="w-4 h-4" /> Saúde (ASO)
            </button>
            {isOperador && (
              <button 
                onClick={() => setActiveTab('cnh')}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all whitespace-nowrap",
                  activeTab === 'cnh' ? "bg-primary text-white shadow-md" : "text-text-secondary hover:bg-surface-hover"
                )}
              >
                <Car className="w-4 h-4" /> Dados CNH
              </button>
            )}
          </div>

          <div className="bg-surface p-6 sm:p-8 rounded-3xl border border-border/60 shadow-sm flex-1">
            
            {/* 🎓 ABA: TREINAMENTOS */}
            {activeTab === 'treinamentos' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-text-main flex items-center gap-2">
                      <GraduationCap className="w-6 h-6 text-primary" /> Matriz de Treinamentos
                    </h3>
                    <p className="text-text-secondary text-sm mt-1">Gira as certificações obrigatórias com base no cargo e adicione extras.</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="secondary" size="sm" onClick={handleExportarIndividual} icon={<Download className="w-4 h-4 text-primary" />}>
                      Exportar Excel
                    </Button>
                    <Button size="sm" onClick={abrirModalLivre} icon={<Plus className="w-4 h-4" />}>
                      Nova NR Extra
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {matrizTreinamentos.map(t => {
                    // RENDENRIZAÇÃO DE PENDÊNCIAS GRAVES
                    if (t.status === 'FALTANTE') {
                      return (
                        <div key={t.id} className="p-4 rounded-2xl border-2 border-dashed border-red-500/50 bg-red-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-red-500/20 rounded-xl shrink-0">
                              <ShieldAlert className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                              <h4 className="font-black text-red-600 text-base">{t.nomeExigido || t.nome}</h4>
                              <p className="text-xs font-bold text-red-600/70 mt-0.5 uppercase tracking-wider">Requisito Obrigatório Faltante</p>
                            </div>
                          </div>
                          <Button variant="secondary" size="sm" onClick={() => abrirModalParaPendencia(t.nome)} className="bg-red-600 text-white border-none hover:bg-red-700 w-full sm:w-auto">
                            Resolver Pendência
                          </Button>
                        </div>
                      );
                    }

                    // RENDENRIZAÇÃO DE TREINAMENTOS ARQUIVADOS
                    return (
                      <div key={t.id} className="p-4 rounded-2xl border border-border/60 bg-background/50 hover:bg-surface-hover transition-colors">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-text-main text-base">{t.nomeExigido || t.nome}</h4>
                              {(t as any).isExtra && <Badge variant="neutral" className="!text-[10px] !py-0">Extra</Badge>}
                            </div>
                            <div className="flex items-center gap-3 text-xs font-medium mt-1">
                              <span className={clsx("px-2 py-0.5 rounded border font-bold uppercase", 
                                t.status === 'VENCIDO' ? "bg-red-500/10 text-red-500 border-red-500/20" : 
                                t.status === 'VENCENDO' ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" : 
                                "bg-green-500/10 text-green-500 border-green-500/20"
                              )}>
                                {t.status}
                              </span>
                              <span className="text-text-muted flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" /> 
                                {(t as any).dataVencimento ? `Vence em: ${DateHelper.getCompleta((t as any).dataVencimento)}` : 'Sem validade'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 bg-surface p-1.5 rounded-xl border border-border/60 shadow-sm shrink-0">
                            <BellRing className="w-4 h-4 text-text-muted ml-2" />
                            <select 
                              className="bg-transparent text-sm font-bold text-text-main border-none outline-none cursor-pointer pr-2"
                              defaultValue={(t as any).diasAntecedenciaAlerta || 30}
                            >
                              <option value="15">Avisar 15 dias antes</option>
                              <option value="30">Avisar 30 dias antes</option>
                              <option value="45">Avisar 45 dias antes</option>
                              <option value="60">Avisar 60 dias antes</option>
                            </select>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-dashed border-border/60 flex items-center justify-between">
                          {(t as any).certificadoUrl ? (
                            <a href={(t as any).certificadoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                              <FileText className="w-4 h-4" /> Ver Certificado em PDF
                            </a>
                          ) : (
                            <span className="text-sm font-medium text-text-muted italic flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 opacity-50" /> Sem PDF anexado
                            </span>
                          )}
                          
                          <Button variant="secondary" size="sm" onClick={handleFakeUpload} icon={<UploadCloud className="w-4 h-4" />}>
                            {(t as any).certificadoUrl ? 'Atualizar PDF' : 'Anexar PDF'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 🩺 ABA: SAÚDE Ocupacional (ASO) */}
            {activeTab === 'aso' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6">
                <div>
                  <h3 className="text-xl font-black text-text-main flex items-center gap-2">
                    <HeartPulse className="w-6 h-6 text-primary" /> Saúde Ocupacional
                  </h3>
                  <p className="text-text-secondary text-sm mt-1">Controlo de Atestado de Saúde (ASO) e capacidade física.</p>
                </div>

                <div className="p-5 sm:p-6 rounded-3xl border border-border/60 bg-background/50 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input label="Data da Última Avaliação" type="date" defaultValue="" />
                    <Input label="Data de Vencimento" type="date" defaultValue="" />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-center p-4 bg-surface rounded-2xl border border-border/60">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-text-main flex items-center gap-2 mb-1">
                        <BellRing className="w-4 h-4 text-primary" /> Regra de Notificação do ASO
                      </p>
                      <p className="text-xs text-text-muted">Com quantos dias de antecedência o RH deve ser alertado?</p>
                    </div>
                    <select className="h-11 px-4 bg-background border border-border/60 rounded-xl text-sm font-bold text-text-main outline-none focus:border-primary">
                      <option value="15">15 dias antes</option>
                      <option value="30" selected>30 dias antes (Padrão)</option>
                      <option value="45">45 dias antes</option>
                      <option value="60">60 dias antes</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-dashed border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                      <p className="text-sm font-bold text-text-main">Ficheiro do Atestado (PDF)</p>
                      <p className="text-xs text-text-muted mt-0.5">Nenhum ficheiro anexado.</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button variant="secondary" className="flex-1 sm:flex-none" onClick={handleFakeUpload} icon={<UploadCloud className="w-4 h-4" />}>
                        Upload PDF
                      </Button>
                      <Button className="flex-1 sm:flex-none" icon={<Save className="w-4 h-4" />}>
                        Guardar ASO
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 🚗 ABA: CNH (Apenas Operadores) */}
            {activeTab === 'cnh' && isOperador && (
               <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6">
                <div>
                  <h3 className="text-xl font-black text-text-main flex items-center gap-2">
                    <Car className="w-6 h-6 text-primary" /> Registo de Habilitação (CNH)
                  </h3>
                  <p className="text-text-secondary text-sm mt-1">Monitorização obrigatória para condutores de frota pesada.</p>
                </div>

                <div className="p-5 sm:p-6 rounded-3xl border border-border/60 bg-background/50 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                    <Input label="Número do Registo" placeholder="Ex: 12345678900" defaultValue={user.profile?.cnhNumero || ''} />
                    <Input label="Categoria" placeholder="Ex: D ou E" defaultValue={user.profile?.cnhCategoria || ''} />
                    <Input label="Validade da CNH" type="date" defaultValue={user.profile?.cnhValidade ? new Date(user.profile.cnhValidade).toISOString().split('T')[0] : ''} />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-center p-4 bg-surface rounded-2xl border border-border/60">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-text-main flex items-center gap-2 mb-1">
                        <BellRing className="w-4 h-4 text-primary" /> Regra de Notificação da CNH
                      </p>
                      <p className="text-xs text-text-muted">Com quantos dias de antecedência o RH deve ser alertado?</p>
                    </div>
                    <select className="h-11 px-4 bg-background border border-border/60 rounded-xl text-sm font-bold text-text-main outline-none focus:border-primary">
                      <option value="15">15 dias antes</option>
                      <option value="30" selected>30 dias antes (Padrão)</option>
                      <option value="45">45 dias antes</option>
                      <option value="60">60 dias antes</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-dashed border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                      <p className="text-sm font-bold text-text-main">Cópia Digital da CNH</p>
                      <p className="text-xs text-text-muted mt-0.5">Nenhum ficheiro anexado.</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button variant="secondary" className="flex-1 sm:flex-none" onClick={handleFakeUpload} icon={<UploadCloud className="w-4 h-4" />}>
                        Upload Imagem/PDF
                      </Button>
                      <Button className="flex-1 sm:flex-none" icon={<Save className="w-4 h-4" />}>
                        Guardar CNH
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* RENDERIZAÇÃO DO MODAL DE TREINAMENTO */}
      {isModalNROpen && (
        <ModalGerenciarTreinamento
          userId={user.id}
          treinamentoPreDefinido={treinamentoPreDefinido}
          onClose={() => setIsModalNROpen(false)}
          onSuccess={() => {
            setIsModalNROpen(false);
            if (refetch) refetch();
          }}
        />
      )}
    </div>
  );
}
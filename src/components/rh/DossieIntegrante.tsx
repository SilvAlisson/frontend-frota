import { useState, useEffect } from 'react';
import { useIntegranteDossie } from '../../hooks/useIntegranteDossie';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { FormEditarUsuario } from '../forms/FormEditarUsuario';
import { DateHelper } from '../../lib/dateHelper';
import { Car, ShieldAlert, GraduationCap, ChevronLeft, ChevronRight, Activity, MapPin, CheckCircle2 } from 'lucide-react';

interface DossieIntegranteProps {
  userId: string;
  onClose: () => void;
}

export function DossieIntegrante({ userId, onClose }: DossieIntegranteProps) {
  const [activeTab, setActiveTab] = useState<'geral' | 'qualificacao' | 'produtividade'>('qualificacao');
  const [page, setPage] = useState(1);
  const { data: dossie, isLoading } = useIntegranteDossie(userId, page);

  // Derive isMotorista safely before the early return to use it in the useEffect
  const userRole = dossie?.user ? ((dossie.user.cargo as { nome?: string })?.nome || dossie.user.role) : null;
  const isMotorista = userRole === 'OPERADOR';

  // 🔴 CORREÇÃO CRÍTICA: useEffect não pode ficar após um early return (if (isLoading) return)
  // Isso causa o erro React #310 (Rendered fewer hooks than expected) ao carregar dados.
  useEffect(() => {
    if (dossie?.user) {
      if (isMotorista) {
        setActiveTab('produtividade');
      } else {
        setActiveTab('qualificacao');
      }
    }
  }, [isMotorista, dossie?.user]);

  if (isLoading || !dossie) {
    return (
      <div className="animate-in slide-in-from-right duration-500 min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-text-muted font-medium">Buscando histórico do integrante...</p>
      </div>
    );
  }

  const { user, jornadas, pagination } = dossie;
  const treinamentos = user.treinamentos || [];
  const defeitos = user.defeitosRegistrados || [];

  const isEquipeCampo = ['OPERADOR', 'ENCARREGADO', 'AUXILIAR_OPERACIONAL'].includes(userRole as string);

  const abasDisponiveis = [
    ...(isMotorista ? [{ id: 'produtividade', label: 'Produtividade & Operação' }] : []),
    { 
      id: 'qualificacao', 
      label: isMotorista ? 'Qualificação (CNH/ASO/NRs)' : 'Qualificação (ASO/NRs)' 
    },
    { id: 'geral', label: 'Dados Cadastrais' }
  ];

  return (
    <div className="animate-in slide-in-from-right duration-500 pb-10">
      {/* HEADER DE NAVEGAÇÃO E RESUMO */}
      <div className="mb-6">
        <button
          className="mb-4 flex items-center gap-2 text-sm font-bold text-text-secondary cursor-pointer hover:text-primary transition-colors w-fit"
          onClick={onClose}
        >
          <span className="p-1.5 bg-surface-hover rounded-lg">←</span> Voltar para a listagem
        </button>

        <div className="bg-surface p-6 sm:p-8 rounded-3xl shadow-sm border border-border/60 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          <Avatar nome={user.nome} url={user.fotoUrl} size="2xl" className="w-24 h-24 sm:w-28 sm:h-28 text-3xl shadow-md border-4 border-surface" />
          <div className="flex flex-col flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-black text-text-main tracking-tight">{user.nome}</h1>
              <Badge variant={user.status === 'ATIVO' ? 'success' : 'neutral'} className="w-fit mx-auto sm:mx-0">
                {user.status || 'ATIVO'}
              </Badge>
            </div>
            <p className="text-text-secondary font-medium flex items-center justify-center sm:justify-start gap-2 mb-4">
              <span className="text-primary font-bold">{(user.cargo as { nome?: string })?.nome || user.role}</span>
              • Matrícula: {user.matricula || 'N/A'}
            </p>

            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              {abasDisponiveis.map(aba => (
                <button
                  key={aba.id}
                  onClick={() => setActiveTab(aba.id as 'geral' | 'qualificacao' | 'produtividade')}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === aba.id ? 'bg-primary text-white shadow-md' : 'bg-surface-hover text-text-secondary hover:text-primary'}`}
                >
                  {aba.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CONTEÚDO DAS ABAS */}
      <div className="bg-surface rounded-3xl shadow-sm border border-border/60 p-6 sm:p-8">
        
        {/* ABA: DADOS CADASTRAIS (EDIÇÃO) */}
        {activeTab === 'geral' && (
          <div className="animate-in fade-in">
            <FormEditarUsuario
              userId={user.id}
              onSuccess={() => {}} // O componente FormEditarUsuario já faz o toast e invalidate
              onCancelar={() => setActiveTab('produtividade')}
              variant="embedded"
            />
          </div>
        )}

        {/* ABA: QUALIFICAÇÃO */}
        {activeTab === 'qualificacao' && (
          <div className="space-y-8 animate-in fade-in">
            {/* CNH SECTION */}
            {isMotorista && (
              <section>
                <h2 className="text-xl font-bold text-text-main flex items-center gap-2 mb-4">
                  <Car className="w-5 h-5 text-primary" /> Dados da CNH
                </h2>
              {user.profile?.cnhNumero ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-surface-hover rounded-2xl border border-border/40">
                    <p className="text-xs text-text-muted font-bold uppercase tracking-wider mb-1">Nº Registro</p>
                    <p className="text-lg font-bold text-text-main">{user.profile.cnhNumero}</p>
                  </div>
                  <div className="p-4 bg-surface-hover rounded-2xl border border-border/40">
                    <p className="text-xs text-text-muted font-bold uppercase tracking-wider mb-1">Categoria</p>
                    <p className="text-lg font-bold text-text-main">{user.profile.cnhCategoria}</p>
                  </div>
                  <div className="p-4 bg-surface-hover rounded-2xl border border-border/40">
                    <p className="text-xs text-text-muted font-bold uppercase tracking-wider mb-1">Validade</p>
                    <p className={`text-lg font-bold ${
                      user.profile.cnhValidade && new Date(user.profile.cnhValidade) < new Date() ? 'text-error' : 'text-success'
                    }`}>
                      {user.profile.cnhValidade ? DateHelper.getCompleta(user.profile.cnhValidade) : 'Não informada'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-surface-hover rounded-2xl border border-dashed border-border/60 text-center">
                  <p className="text-text-muted font-medium">Nenhuma CNH cadastrada neste perfil.</p>
                </div>
              )}
              </section>
            )}

            {/* TREINAMENTOS SECTION */}
            <section>
              <h2 className="text-xl font-bold text-text-main flex items-center gap-2 mb-4">
                <GraduationCap className="w-5 h-5 text-primary" /> Treinamentos e ASOs
              </h2>
              {treinamentos.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-text-secondary border-collapse">
                    <thead className="bg-surface-hover">
                      <tr>
                        <th className="px-4 py-3 font-bold text-text-main uppercase text-xs tracking-wider rounded-l-xl">Treinamento</th>
                        <th className="px-4 py-3 font-bold text-text-main uppercase text-xs tracking-wider">Certificado</th>
                        <th className="px-4 py-3 font-bold text-text-main uppercase text-xs tracking-wider rounded-r-xl">Vencimento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {treinamentos.map(t => {
                        const vencido = t.dataVencimento ? new Date(t.dataVencimento) < new Date() : false;
                        return (
                          <tr key={t.id} className="hover:bg-surface-hover/30 transition-colors">
                            <td className="px-4 py-3 font-medium text-text-main">{t.nome}</td>
                            <td className="px-4 py-3">
                              {t.certificadoUrl ? (
                                <a href={t.certificadoUrl} target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">Ver Documento</a>
                              ) : '-'}
                            </td>
                            <td className="px-4 py-3">
                              {t.dataVencimento ? (
                                <Badge variant={vencido ? 'danger' : 'success'}>
                                  {DateHelper.getCompleta(t.dataVencimento)}
                                </Badge>
                              ) : (
                                <Badge variant="neutral">Sem Vencimento</Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 bg-surface-hover rounded-2xl border border-dashed border-border/60 text-center">
                  <p className="text-text-muted font-medium">Nenhum treinamento registrado.</p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ABA: PRODUTIVIDADE */}
        {activeTab === 'produtividade' && isMotorista && (
          <div className="space-y-8 animate-in fade-in">
            {/* JORNADAS SECTION */}
            <section>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" /> Histórico de Jornadas
                </h2>
                <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold text-sm">
                  Total Registrado: {pagination.total} jornadas
                </div>
              </div>

              {jornadas.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {jornadas.map(j => {
                      const kmRodado = (j.kmFim ?? 0) - (j.kmInicio ?? 0);
                      const isAtiva = !j.dataFim;
                      return (
                        <div key={j.id} className="p-5 bg-surface-hover rounded-2xl border border-border/40 flex flex-col justify-between">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <Badge variant={isAtiva ? 'warning' : 'success'}>
                                {isAtiva ? 'Em Andamento' : 'Concluída'}
                              </Badge>
                            </div>
                            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                              {DateHelper.getCompleta(j.dataInicio)}
                            </span>
                          </div>
                          
                          <div className="space-y-1.5 mb-4">
                            <p className="text-sm font-bold text-text-main flex items-center gap-1.5">
                              <Car className="w-4 h-4 text-primary" /> {j.veiculo?.placa || 'Veículo Desconhecido'}
                            </p>
                            {j.observacoes && (
                              <p className="text-xs font-medium text-text-secondary flex items-start gap-1.5">
                                <MapPin className="w-4 h-4 text-text-muted shrink-0 mt-0.5" /> 
                                <span className="line-clamp-2">{j.observacoes}</span>
                              </p>
                            )}
                          </div>

                          <div className="pt-3 border-t border-dashed border-border/60 flex justify-between items-center text-sm">
                            <div className="flex flex-col">
                              <span className="text-xs text-text-muted font-bold">KM Rodado</span>
                              <span className="font-black text-text-main">{kmRodado > 0 ? `${kmRodado} km` : '-'}</span>
                            </div>
                            <div className="flex flex-col text-right">
                              <span className="text-xs text-text-muted font-bold">Duração</span>
                              <span className="font-bold text-text-secondary">
                                {j.dataFim 
                                  ? `${Math.max(1, Math.round((new Date(j.dataFim).getTime() - new Date(j.dataInicio).getTime()) / (1000 * 60 * 60)))}h`
                                  : '-'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* PAGINAÇÃO */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-6">
                      <Button
                        variant="secondary"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="rounded-xl px-4 py-2"
                      >
                        <ChevronLeft className="w-4 h-4 mr-2" /> Anterior
                      </Button>
                      <span className="text-sm font-bold text-text-secondary">
                        Página <span className="text-text-main">{page}</span> de {pagination.totalPages}
                      </span>
                      <Button
                        variant="secondary"
                        onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                        disabled={page === pagination.totalPages}
                        className="rounded-xl px-4 py-2"
                      >
                        Próxima <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-6 bg-surface-hover rounded-2xl border border-dashed border-border/60 text-center">
                  <p className="text-text-muted font-medium">Nenhuma jornada operacional registrada nos últimos 30 dias.</p>
                </div>
              )}
            </section>

            {/* DEFEITOS REGISTRADOS */}
            <section className="pt-6 border-t border-border/50">
              <h2 className="text-xl font-bold text-text-main flex items-center gap-2 mb-4">
                <ShieldAlert className="w-5 h-5 text-primary" /> Defeitos Reportados pelo Operador
              </h2>
              {defeitos.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-text-secondary border-collapse">
                    <thead className="bg-surface-hover">
                      <tr>
                        <th className="px-4 py-3 font-bold text-text-main uppercase text-xs tracking-wider rounded-l-xl">Data</th>
                        <th className="px-4 py-3 font-bold text-text-main uppercase text-xs tracking-wider">Veículo</th>
                        <th className="px-4 py-3 font-bold text-text-main uppercase text-xs tracking-wider">Defeito</th>
                        <th className="px-4 py-3 font-bold text-text-main uppercase text-xs tracking-wider rounded-r-xl">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {defeitos.map(d => (
                        <tr key={d.id} className="hover:bg-surface-hover/30 transition-colors">
                          <td className="px-4 py-3 font-medium text-text-main">{DateHelper.getCompleta(d.createdAt)}</td>
                          <td className="px-4 py-3 font-bold text-text-main">{d.veiculo?.placa || '-'}</td>
                          <td className="px-4 py-3">
                            <span className="font-bold block text-text-main">{d.categoria}</span>
                            <span className="text-xs text-text-muted line-clamp-1">{d.descricao}</span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={d.status === 'RESOLVIDO' ? 'success' : d.status === 'EM_ANALISE' ? 'warning' : 'danger'}>
                              {d.status.replace('_', ' ')}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 bg-surface-hover rounded-2xl border border-dashed border-border/60 text-center flex flex-col items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-success mb-2" />
                  <p className="text-text-muted font-medium">Nenhum defeito reportado recentemente.</p>
                </div>
              )}
            </section>
          </div>
        )}

      </div>
    </div>
  );
}

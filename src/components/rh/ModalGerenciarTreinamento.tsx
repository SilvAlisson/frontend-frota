import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, UploadCloud, GraduationCap, Calendar, BellRing } from 'lucide-react';

interface ModalGerenciarTreinamentoProps {
  userId: string;
  treinamentoPreDefinido?: string; // Se vier do dicionário do cargo (Ex: NR-35)
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalGerenciarTreinamento({ userId, treinamentoPreDefinido, onClose, onSuccess }: ModalGerenciarTreinamentoProps) {
  const [nome, setNome] = useState(treinamentoPreDefinido || '');
  const [dataRealizacao, setDataRealizacao] = useState('');
  const [dataValidade, setDataValidade] = useState('');
  const [diasAlerta, setDiasAlerta] = useState('30');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // [FASE 3] O Estado para o Ficheiro PDF que irá para o Cloudflare R2
  const [arquivoPdf, setArquivoPdf] = useState<File | null>(null);

  const handleSalvar = async () => {
    if (!nome || !dataRealizacao) return; // Validação básica
    
    setIsSubmitting(true);
    try {
      // [FASE 3] Aqui entrará a lógica de Upload para o Cloudflare R2 e o POST para o Prisma
      console.log("A Guardar:", { userId, nome, dataRealizacao, dataValidade, diasAlerta, arquivoPdf });
      
      // Simulação de tempo de rede
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-lg rounded-3xl shadow-float-primary border border-border/60 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* HEADER DO MODAL */}
        <div className="flex items-center justify-between p-6 border-b border-border/40 bg-surface-hover/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-text-main tracking-tight">
                {treinamentoPreDefinido ? 'Atualizar Certificação' : 'Nova Certificação Extra'}
              </h2>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mt-0.5">Gestão de Conformidade</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-text-muted hover:text-error hover:bg-error/10 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CORPO DO MODAL (FORMULÁRIO) */}
        <div className="p-6 space-y-6">
          <Input 
            label="Nome do Treinamento / NR" 
            placeholder="Ex: NR-35 Trabalho em Altura"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            disabled={!!treinamentoPreDefinido} // Se for obrigatório do cargo, não deixa mudar o nome
          />

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Data de Realização" 
              type="date"
              value={dataRealizacao}
              onChange={(e) => setDataRealizacao(e.target.value)}
              icon={<Calendar className="w-4 h-4 text-text-muted" />}
            />
            <Input 
              label="Validade (Opcional)" 
              type="date"
              value={dataValidade}
              onChange={(e) => setDataValidade(e.target.value)}
            />
          </div>

          <div className="p-4 bg-background rounded-2xl border border-border/60 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <BellRing className="w-4 h-4 text-primary" />
              <label className="text-sm font-bold text-text-main">Regra de Notificação (Alerta RH)</label>
            </div>
            <select 
              value={diasAlerta}
              onChange={(e) => setDiasAlerta(e.target.value)}
              className="w-full h-11 px-4 bg-surface border border-border/60 rounded-xl text-sm font-bold text-text-main outline-none focus:border-primary transition-colors cursor-pointer"
            >
              <option value="15">Avisar 15 dias antes do vencimento</option>
              <option value="30">Avisar 30 dias antes do vencimento</option>
              <option value="45">Avisar 45 dias antes do vencimento</option>
              <option value="60">Avisar 60 dias antes do vencimento</option>
            </select>
          </div>

          {/* ÁREA DE UPLOAD */}
          <div className="border-2 border-dashed border-primary/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group">
            <div className="p-3 bg-surface rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-bold text-text-main">Anexar Certificado em PDF</p>
            <p className="text-xs text-text-muted mt-1">Clique para procurar no computador</p>
            <input 
              type="file" 
              accept="application/pdf,image/*" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setArquivoPdf(e.target.files[0]);
                }
              }}
            />
            {arquivoPdf && (
              <div className="mt-4 p-2 bg-success/10 border border-success/20 rounded-lg w-full text-success text-xs font-bold truncate">
                Ficheiro selecionado: {arquivoPdf.name}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER DO MODAL */}
        <div className="p-6 border-t border-border/40 bg-surface-hover/30 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
          <Button onClick={handleSalvar} isLoading={isSubmitting}>
            {treinamentoPreDefinido ? 'Arquivar Certificado' : 'Adicionar Treinamento'}
          </Button>
        </div>

      </div>
    </div>
  );
}
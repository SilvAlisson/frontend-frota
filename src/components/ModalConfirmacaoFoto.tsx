import { useState, useEffect, useMemo } from 'react';
import { usePhotoSubmit } from '../hooks/usePhotoSubmit';
import { comprimirImagem } from '../utils/imageUtils';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { hapticError } from '../lib/haptics';
import { toast } from 'sonner';
import { logger } from '../lib/logger';
import { Camera, Loader2, Check, AlertCircle } from 'lucide-react';
import { ModalAlertaSSMA } from './rh/ModalAlertaSSMA';
import axios from 'axios';

// Estilos padronizados Premium
const fileInputContainer = "relative border-2 border-dashed border-border/60 rounded-3xl p-4 hover:bg-surface-hover transition-all duration-300 cursor-pointer group hover:border-primary/50 flex flex-col items-center justify-center min-h-[280px] overflow-hidden bg-surface shadow-sm";
const hiddenInput = "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10";

interface ModalProps<T = object, R = unknown> {
  titulo: string;
  kmParaConfirmar: number | null;
  jornadaId: string | null;
  dadosJornada: T;
  apiEndpoint: string;
  apiMethod: 'POST' | 'PUT';
  onClose: () => void;
  onSuccess: (data: R) => void;
  nested?: boolean;
  permitirGaleria?: boolean;
}

export function ModalConfirmacaoFoto<T extends object, R = unknown>({
  titulo,
  kmParaConfirmar,
  jornadaId,
  dadosJornada,
  apiEndpoint,
  apiMethod,
  onClose,
  onSuccess,
  nested = false,
  permitirGaleria = false
}: ModalProps<T, R>) {

  const [foto, setFoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processandoFoto, setProcessandoFoto] = useState(false);

  // Estados do Modal SSMA
  const [bloqueiosSSMA, setBloqueiosSSMA] = useState<string[]>([]);
  const [modalSSMAOpen, setModalSSMAOpen] = useState(false);

  const { submitPhoto, loading } = usePhotoSubmit<T>();

  const textoAjuda = useMemo(() => {
    if (apiEndpoint.includes('abastecimentos')) {
      return "Foto nítida da Nota Fiscal ou da Bomba de Combustível.";
    }
    if (apiEndpoint.includes('manutencoes') || apiEndpoint.includes('ordens-servico')) {
      return "Foto da Ordem de Serviço (OS), Nota Fiscal ou Peça.";
    }
    return "Certifique-se que o KM e o painel estejam visíveis.";
  }, [apiEndpoint]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const arquivoOriginal = e.target.files[0];

      try {
        setProcessandoFoto(true);
        const imagemComprimida = await comprimirImagem(arquivoOriginal);
        const url = URL.createObjectURL(imagemComprimida);
        setPreviewUrl(url);
        setFoto(imagemComprimida);

      } catch (error) {
        logger.apiError(error, 'Erro ao processar imagem.');
        hapticError();
        toast.error("Erro ao processar a foto. Tente novamente.");
        setFoto(null);
        setPreviewUrl(null);
      } finally {
        setProcessandoFoto(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!foto) {
      hapticError();
      toast.error('A foto do comprovante é obrigatória.');
      return;
    }

    try {
      const data = await submitPhoto({
        foto,
        apiEndpoint,
        apiMethod,
        jornadaId,
        dadosJornada
      });
      onSuccess(data);
      safeOnClose();
    } catch (err: unknown) {
      // axios.isAxiosError é o type guard correto para erros HTTP tipados
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        const data = err.response.data as { bloqueios?: string[] };
        if (data.bloqueios) {
          hapticError();
          setBloqueiosSSMA(data.bloqueios);
          setModalSSMAOpen(true);
          return; // Interrompe o fluxo e não exibe o toast genérico
        }
      }
      logger.apiError(err, 'Erro ao enviar foto. Tente novamente.');
    }
  };

  // Trava de segurança extra para impedir fecho acidental no "X"
  const safeOnClose = () => {
    if (!loading && !processandoFoto) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={safeOnClose}
      title={titulo}
      nested={nested}
      className="max-w-md" // Mantém a proporção elegante para fotos
    >
      <div className="flex flex-col h-full space-y-6">

        {/* CONTEÚDO PRINCIPAL */}
        <div className="space-y-6">
          {/* Visor de Painel */}
          {kmParaConfirmar !== null && (
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-5 rounded-2xl border border-primary/20 text-center shadow-inner relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay"></div>
              <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mb-1.5 relative z-10">
                Leitura do Painel
              </p>
              <p className="text-4xl font-black text-primary tracking-tighter font-mono relative z-10">
                {kmParaConfirmar.toLocaleString('pt-BR')} <span className="text-lg text-primary/60 font-bold ml-1">km</span>
              </p>
            </div>
          )}

          {/* Área de Upload / Preview */}
          <div className="space-y-2.5">
            <label className="block text-sm font-black text-text-main flex items-center justify-between">
              <span>Foto do Comprovante <span className="text-error ml-1">*</span></span>
              {previewUrl && !loading && (
                <span className="text-xs text-primary font-bold cursor-pointer hover:underline uppercase tracking-wide">
                  Trocar foto
                </span>
              )}
            </label>

            <div className={`${fileInputContainer} ${previewUrl ? 'border-transparent p-0 bg-black/5' : ''}`}>
              <input
                type="file"
                accept="image/*"
                // Se permitirGaleria for true, o React remove o capture e o celular mostra a opção de Galeria!
                capture={permitirGaleria ? undefined : "environment"} 
                className={hiddenInput}
                onChange={handleFileChange}
                disabled={loading || processandoFoto}
              />

              {processandoFoto ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                  <p className="text-sm text-primary font-bold animate-pulse">Otimizando imagem...</p>
                </div>
              ) : previewUrl ? (
                <div className="relative w-full h-full min-h-[280px] group rounded-3xl overflow-hidden bg-black/10">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full absolute inset-0 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-100 pointer-events-none"></div>
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none backdrop-blur-sm">
                    <Camera className="w-10 h-10 text-white mb-2" />
                    <p className="text-white font-bold text-sm tracking-wide">Toque para alterar</p>
                  </div>
                  <div className="absolute top-4 right-4 bg-emerald-500 text-white p-2 rounded-full shadow-lg border border-white/20">
                    <Check className="w-5 h-5" />
                  </div>
                </div>
              ) : (
                <div className="text-center p-4">
                  <div className="w-20 h-20 mx-auto bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm border border-primary/20">
                    <Camera className="w-10 h-10" />
                  </div>
                  <p className="text-base font-black text-text-main tracking-tight">
                    {permitirGaleria ? 'Toque para escolher foto da galeria ou câmera' : 'Toque para abrir a câmera'}
                  </p>
                  <div className="mt-3 inline-flex items-start gap-2 bg-surface-hover py-2 px-3 rounded-xl border border-border/60 max-w-[240px]">
                    <AlertCircle className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                    <p className="text-xs text-text-secondary font-medium leading-relaxed text-left">
                      {textoAjuda}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 🔥 RODAPÉ STICKY (O truque -mx-5 -mb-5 cola-o aos limites do Modal) 🔥 */}
        <div className="mt-auto pt-5 border-t border-border/60 bg-surface flex gap-3 pb-safe -mx-5 -mb-5 p-5 sticky bottom-0 z-10 rounded-b-[2rem]">
          <Button
            type="button"
            variant="ghost"
            className="flex-1 h-14 font-bold bg-surface-hover/50 hover:bg-surface-hover"
            onClick={safeOnClose}
            disabled={loading || processandoFoto}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            className="flex-[2] h-14 text-base font-black shadow-float hover:shadow-lg transition-all"
            onClick={handleSubmit}
            disabled={loading || !foto || processandoFoto}
            isLoading={loading}
          >
            {loading ? 'Enviando...' : 'Confirmar Envio'}
          </Button>
        </div>

      </div>

      {/* 🛡️ MODAL DE BLOQUEIO OPERACIONAL (SSMA) */}
      <ModalAlertaSSMA 
        isOpen={modalSSMAOpen}
        bloqueios={bloqueiosSSMA}
        onClose={() => {
          setModalSSMAOpen(false);
          safeOnClose(); // Força o fechamento também da tela de foto, retornando o usuário
        }}
      />
    </Modal>
  );
}

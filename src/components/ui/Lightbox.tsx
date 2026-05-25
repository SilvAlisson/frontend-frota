import * as Dialog from '@radix-ui/react-dialog';
import { X, ZoomIn, ZoomOut, RotateCcw, AlertTriangle, Loader2, Download, FileText, Camera } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { cn } from '../../lib/utils';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface LightboxProps {
  /** URL da imagem a ser exibida. `null` ou `undefined` mantém o Lightbox fechado. */
  src: string | null | undefined;
  /** Texto alternativo descritivo da imagem (WCAG 1.1.1 — Nível A). */
  alt: string;
  /** Legenda exibida abaixo da imagem. Se omitida, herda o valor de `alt`. */
  caption?: string;
  /** Callback disparado ao fechar o Lightbox. */
  onClose: () => void;
  /** Classe extra para o container interno da imagem. */
  imageClassName?: string;
}

type MediaStatus = 'loading' | 'loaded' | 'error';

// ─── Componente ───────────────────────────────────────────────────────────────

export function Lightbox({ src, alt, caption, onClose, imageClassName }: LightboxProps) {
  const isOpen = !!src;
  const [status, setStatus] = useState<MediaStatus>('loading');
  
  const isPdf = src?.toLowerCase().includes('.pdf');
  const displayCaption = caption ?? alt;

  useEffect(() => {
    if (src) setStatus(isPdf ? 'loaded' : 'loading');
  }, [src, isPdf]);

  const handleDownload = useCallback(() => {
    if (!src) return;
    const link = document.createElement('a');
    link.href = src;
    link.download = alt || 'documento-klin';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [src, alt]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[9998] bg-black/90 backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 duration-300" />

        <Dialog.Content 
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 duration-300"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">Visualizador: {alt}</Dialog.Title>

          {/* HUD Superior (Controlos e Título) */}
          <div className="absolute top-0 left-0 w-full flex justify-between items-center p-4 sm:p-6 bg-gradient-to-b from-black/80 to-transparent z-50 pointer-events-none">
            <div className="flex items-center gap-3 pointer-events-auto">
              <div className="w-10 h-10 bg-info/20 flex items-center justify-center rounded-lg border border-info/30 text-info backdrop-blur-md">
                <FileText className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <span className="text-white font-black uppercase text-sm tracking-widest block drop-shadow-md">{alt}</span>
                <span className="text-info font-medium text-[10px] uppercase tracking-wider block">KLIN Media Viewer</span>
              </div>
            </div>

            <div className="flex gap-2 pointer-events-auto">
              <button onClick={handleDownload} className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/10 hover:bg-white/25 text-white backdrop-blur-md transition-all active:scale-95" aria-label="Baixar ficheiro">
                <Download className="w-5 h-5" />
              </button>
              <Dialog.Close className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/10 hover:bg-error/80 hover:text-white text-white/80 backdrop-blur-md transition-all active:scale-95" aria-label="Fechar">
                <X className="w-6 h-6" />
              </Dialog.Close>
            </div>
          </div>

          {/* Área Central - Media Viewer */}
          <div className="w-full h-full flex flex-col items-center justify-center touch-none">
            
            {status === 'loading' && !isPdf && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/60">
                <Loader2 className="w-10 h-10 animate-spin" />
                <span className="text-sm font-bold tracking-widest uppercase">Processando Mídia...</span>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center justify-center gap-4 text-white/70">
                <AlertTriangle className="w-12 h-12 text-warning" />
                <p className="text-base font-bold uppercase tracking-widest">Falha ao carregar</p>
              </div>
            )}

            {src && isPdf ? (
              // PDF Viewer
              <div className="w-full h-full pt-20 pb-6 px-4 sm:px-8 max-w-7xl mx-auto flex-1 pointer-events-auto">
                <iframe
                  src={`${src}#toolbar=0&navpanes=0&scrollbar=0`}
                  className="w-full h-full rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 bg-white"
                  title={alt}
                />
              </div>
            ) : src ? (
              // Image Viewer com Física Elástica
              <TransformWrapper
                initialScale={1}
                minScale={0.8}
                maxScale={5}
                centerOnInit
                limitToBounds={true}
                smooth={true}
                wheel={{ step: 0.1 }} /* ERRO 1 CORRIGIDO: smoothStep alterado para step */
                panning={{ velocityDisabled: false, lockAxisY: false, lockAxisX: false }}
                doubleClick={{ mode: "toggle", step: 3 }}
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    <TransformComponent
                      wrapperStyle={{ width: "100%", height: "100%" }}
                      contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <img
                        src={src}
                        alt={alt}
                        onLoad={() => setStatus('loaded')}
                        onError={() => setStatus('error')}
                        draggable={false}
                        className={cn(
                          "max-h-[85vh] max-w-[95vw] object-contain rounded-xl shadow-2xl transition-opacity duration-300 pointer-events-auto",
                          status === 'loaded' ? 'opacity-100' : 'opacity-0',
                          imageClassName
                        )}
                      />
                    </TransformComponent>

                    {/* Legenda Opcional Integrada */}
                    {status === 'loaded' && displayCaption && (
                      <div className="absolute bottom-24 pointer-events-none flex items-center gap-2 text-white/80 text-sm font-bold uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2 duration-300 drop-shadow-md">
                        <Camera className="w-4 h-4 shrink-0" />
                        {displayCaption}
                      </div>
                    )}

                    {/* HUD Inferior - Controlos Manuais */}
                    <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10 shadow-2xl pointer-events-auto">
                      <button onClick={() => zoomOut()} className="p-3 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors active:scale-95">
                        <ZoomOut className="w-5 h-5" />
                      </button>
                      <div className="w-[1px] h-6 bg-white/10 mx-1" />
                      <button onClick={() => resetTransform()} className="p-3 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors active:scale-95">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <div className="w-[1px] h-6 bg-white/10 mx-1" />
                      <button onClick={() => zoomIn()} className="p-3 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors active:scale-95">
                        <ZoomIn className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                )}
              </TransformWrapper>
            ) : null /* Adicionado o ": null" no final do bloco do ternário */} 
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
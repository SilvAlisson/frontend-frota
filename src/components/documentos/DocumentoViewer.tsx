import { FileText, ZoomIn, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface DocumentoViewerProps {
  url: string;
  titulo: string;
  zoomNivel: number;
  onZoomChange: (novoZoom: number) => void;
  onClose: () => void;
}

export function DocumentoViewer({ url, titulo, zoomNivel, onZoomChange, onClose }: DocumentoViewerProps) {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-3xl p-4 sm:p-8 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
      {/* Top Navigation Bar HUD */}
      <div className="absolute top-0 left-0 w-full flex justify-between items-center p-6 bg-gradient-to-b from-black/80 to-transparent z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-info/20 flex items-center justify-center rounded-lg border border-info/30 text-info">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-white font-black uppercase text-sm tracking-widest block">{titulo}</span>
            <span className="text-info font-medium text-[10px] uppercase tracking-wider block">Visualizador de Documentos Legais</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            className="bg-white/10 hover:bg-white/20 text-white rounded-xl h-11 w-11 touch-target focus-ring"
            onClick={() => onZoomChange(zoomNivel < 4 ? zoomNivel + 0.5 : zoomNivel)}
            title="Aumentar Zoom"
            aria-label="Aumentar Zoom"
          >
            <ZoomIn className="w-5 h-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="bg-white/10 hover:bg-white/20 text-white rounded-xl h-11 w-11 touch-target focus-ring"
            onClick={onClose}
            title="Fechar Visualizador"
            aria-label="Fechar Visualizador"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Imagem/PDF Viewer */}
      <div className="w-full max-w-5xl h-full flex items-center justify-center overflow-auto rounded-3xl mt-16 sm:mt-0 cursor-move scrollbar-thin">
        {url.toLowerCase().includes('.pdf') ? (
          <iframe
            src={`${url}#toolbar=0`}
            className="w-full h-[85vh] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10"
            style={{ zoom: zoomNivel }}
            title={titulo}
          />
        ) : (
          <img
            src={url}
            alt={titulo}
            style={{ zoom: zoomNivel }}
            className="max-h-[85vh] max-w-full object-contain pointer-events-auto rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] filter contrast-125 transition-transform duration-300"
            onDoubleClick={() => onZoomChange(zoomNivel > 1 ? 1 : 2.5)}
            title="Clique duplo para Zoom Rápido"
            draggable={false}
          />
        )}
      </div>

      {/* Dica Floating Bar */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/60 border border-white/10 text-white font-bold text-[10px] uppercase tracking-widest px-6 py-3 rounded-full flex gap-3 backdrop-blur shadow-2xl items-center pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-info animate-pulse"></span>
        Toque no botão de lupa ou dê duplo-clique na imagem para Inspecionar
      </div>
    </div>
  );
}

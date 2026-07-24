import React, { useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { Button } from '../ui/Button';
import { Download, Copy, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CartazAniversarioProps {
  nome: string;
  fotoUrl?: string | null;
  onClose?: () => void;
}

export function CartazAniversario({ nome, fotoUrl, onClose }: CartazAniversarioProps) {
  const cartazRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Usa foto padrão caso não tenha
  const avatarImage = fotoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${nome}&backgroundColor=0f172a&textColor=ffffff`;

  const copyToClipboard = async () => {
    if (!cartazRef.current) return;
    
    try {
      setIsGenerating(true);
      // html-to-image to get blob
      const blob = await htmlToImage.toBlob(cartazRef.current, {
        quality: 1,
        pixelRatio: 2, // Retinadisplay high res
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          margin: '0'
        }
      });
      
      if (blob) {
        // Tenta copiar para o clipboard (Navigator API)
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        
        setIsCopied(true);
        toast.success('Cartaz copiado para a área de transferência! Cole (Ctrl+V) no WhatsApp.');
        
        setTimeout(() => setIsCopied(false), 3000);
      }
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      toast.error('Erro ao gerar o cartaz. Seu navegador pode não suportar esta ação.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async () => {
    if (!cartazRef.current) return;
    
    try {
      setIsGenerating(true);
      const dataUrl = await htmlToImage.toPng(cartazRef.current, {
        quality: 1,
        pixelRatio: 2
      });
      
      const link = document.createElement('a');
      link.download = `Aniversario_${nome.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
      
      toast.success('Cartaz baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      toast.error('Erro ao gerar o cartaz.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      
      {/* Container Oculto / Visível - Onde o design é montado */}
      <div 
        ref={cartazRef}
        // Tailwind estilos inspirados na imagem de referência
        className="relative overflow-hidden flex flex-col items-center justify-between"
        style={{
          width: '400px',
          height: '711px', // Proporção ~16:9 vertical (Stories/Status)
          background: 'linear-gradient(145deg, #a7f3d0 0%, #bfdbfe 50%, #ddd6fe 100%)', // Verde pastel -> Azul -> Roxo
          padding: '40px 20px',
          boxSizing: 'border-box'
        }}
      >
        {/* Enfeites BG (SVG simples) */}
        <div className="absolute top-10 right-10 text-6xl opacity-80" style={{ transform: 'rotate(15deg)' }}>🎉</div>
        <div className="absolute top-40 -left-6 text-7xl opacity-80" style={{ transform: 'rotate(-20deg)' }}>🎈</div>
        <div className="absolute bottom-40 right-0 text-7xl opacity-80" style={{ transform: 'rotate(10deg)' }}>🎈</div>
        <div className="absolute bottom-20 -left-6 text-7xl opacity-90" style={{ transform: 'rotate(-10deg)' }}>🧁</div>

        {/* Header Texto */}
        <div className="z-10 text-center mt-4">
          <h1 className="text-4xl font-black text-teal-800 drop-shadow-sm leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Feliz<br />Aniversário
          </h1>
        </div>

        {/* Polaroid Frame para a Foto */}
        <div className="z-10 bg-white p-3 pb-8 shadow-xl mt-6 relative" style={{ width: '250px', transform: 'rotate(-2deg)' }}>
           {/* Fita adesiva / Chapeu decorativo */}
           <div className="absolute -top-10 -right-6 text-6xl z-20" style={{ transform: 'rotate(15deg)' }}>
            🥳
           </div>
           <div 
              className="w-full h-[250px] bg-slate-100 bg-cover bg-center border border-slate-200"
              style={{ backgroundImage: `url(${avatarImage})` }}
           />
           <div className="text-center mt-3 font-mono text-sm text-slate-400 rotate-90 absolute right-[-40px] top-[100px]">
             23 ▷
           </div>
        </div>

        {/* Texto de Parabéns */}
        <div className="z-10 bg-white/95 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-lg mt-8 border border-white/40 text-center mx-4" style={{ transform: 'rotate(1deg)' }}>
          <h2 className="text-xl font-bold text-teal-700 mb-2 uppercase">Parabéns {nome.split(' ')[0]}!!!</h2>
          <p className="text-teal-900 font-medium text-sm leading-snug">
            A equipe Klin deseja um feliz aniversário e um dia repleto de coisas boas!
          </p>
        </div>

        {/* Logo Klin (usando a do public) */}
        <div className="z-10 mt-auto mb-4">
          <img src="/logo.png" alt="KLIN Logo" className="h-12 object-contain mix-blend-multiply" />
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-4 w-full max-w-[400px]">
        <Button 
          onClick={copyToClipboard} 
          disabled={isGenerating}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          {isGenerating && !isCopied ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 
           isCopied ? <Check className="w-4 h-4 mr-2" /> : 
           <Copy className="w-4 h-4 mr-2" />}
          {isCopied ? 'Copiado!' : 'Copiar p/ WhatsApp'}
        </Button>
        <Button 
          onClick={downloadImage}
          disabled={isGenerating}
          variant="outline"
        >
          <Download className="w-4 h-4 mr-2" />
          Baixar
        </Button>
      </div>

    </div>
  );
}

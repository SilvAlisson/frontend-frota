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
        // Tailwind estilos precisos para imitar a arte Canva
        className="relative overflow-hidden flex flex-col items-center justify-between"
        style={{
          width: '400px',
          height: '711px', // Proporção 16:9
          background: 'linear-gradient(135deg, #ccfbf1 0%, #dbeafe 50%, #e0e7ff 100%)', // Fundo pastel suave
          padding: '40px 20px 20px 20px',
          boxSizing: 'border-box'
        }}
      >
        {/* Cupcake gigante na esquerda inferior */}
        <div className="absolute z-20 text-[130px] drop-shadow-md" style={{ bottom: '140px', left: '-30px', transform: 'rotate(-10deg)' }}>🧁</div>
        
        {/* Balões na direita inferior */}
        <div className="absolute z-20 text-[110px] drop-shadow-md" style={{ bottom: '170px', right: '-15px', transform: 'rotate(10deg)' }}>🎈</div>
        <div className="absolute z-10 text-[80px] drop-shadow-md" style={{ bottom: '230px', right: '40px', transform: 'rotate(-15deg)' }}>🎈</div>

        {/* Header Texto */}
        <div className="z-10 text-center mt-2 relative">
          <h1 className="font-black text-[#137a7f] drop-shadow-sm leading-[0.9] tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
            <span className="text-[46px]">Feliz</span><br />
            <span className="text-[54px]">Aniversário</span>
          </h1>
        </div>

        {/* Polaroid Frame para a Foto */}
        <div className="z-20 bg-white p-3 shadow-xl mt-12 relative" style={{ width: '280px', height: '310px' }}>
           {/* Chapeuzinho no topo da polaroid */}
           <div className="absolute z-30 text-[65px] drop-shadow-md" style={{ top: '-45px', left: '50%', transform: 'translateX(-50%) rotate(12deg)' }}>🥳</div>
           
           {/* Foto */}
           <div 
              className="w-full h-[240px] bg-slate-100 bg-cover bg-center border border-slate-100"
              style={{ backgroundImage: `url(${avatarImage})` }}
           />
           
           {/* Marcas de Polaroid */}
           <div className="absolute left-0 bottom-2 w-full flex justify-between px-5">
              <span className="text-slate-300 text-[10px] font-mono tracking-widest">23 ▷</span>
              <span className="text-slate-300 text-[10px] font-mono tracking-widest rotate-180">◁ 23</span>
           </div>
        </div>

        {/* Texto de Parabéns (Estilo Pincelada / Cartão) */}
        <div className="z-30 bg-white px-8 py-5 mt-auto mb-4 border-0 text-center shadow-sm w-[360px]" style={{ 
            borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px', // Brush stroke CSS effect
            transform: 'rotate(-1deg)'
        }}>
          <h2 className="text-[22px] font-extrabold text-[#1c6969] mb-1 tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
            Parabéns, {nome.split(' ')[0]}!
          </h2>
          <p className="text-[#457e7e] font-bold text-[14px] leading-tight px-1">
            A equipe Klin deseja um feliz aniversário e um dia repleto de coisas boas!
          </p>
        </div>

        {/* Logo Klin (usando a do public) */}
        <div className="z-10 mt-auto">
          <img src="/logo.png" alt="KLIN Logo" className="h-14 object-contain mix-blend-multiply opacity-95" />
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

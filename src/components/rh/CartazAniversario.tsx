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
        className="relative overflow-hidden w-[400px] h-[711px] bg-cover bg-center shadow-2xl rounded-lg"
        style={{ backgroundImage: "url('/template-aniversario.png')" }}
      >
        
        {/* Foto do Integrante (Posicionada sobre a polaroid branca do template) */}
        {/* Valores ajustados estimando a posição da polaroid no Canva */}
        <div 
          className="absolute z-10 bg-slate-200 bg-cover bg-center rounded-sm"
          style={{ 
             top: '25.5%', 
             left: '13%', 
             width: '74%', 
             height: '42.5%', 
             backgroundImage: `url(${avatarImage})`,
             boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)'
          }}
        />

        {/* Overlay para cobrir o "Parabéns" original da imagem e centralizar com o nome */}
        <div 
          className="absolute z-20 w-full flex justify-center"
          style={{ top: '72.8%' }}
        >
           {/* Uma pequena tarja branca com bordas suaves para mascarar o texto de baixo */}
           <div className="bg-white px-10 py-1.5 flex items-center justify-center relative">
             {/* Borrões brancos nas pontas para mesclar com a pincelada do template */}
             <div className="absolute left-[-10px] top-0 bottom-0 w-[20px] bg-gradient-to-r from-transparent to-white"></div>
             <div className="absolute right-[-10px] top-0 bottom-0 w-[20px] bg-gradient-to-l from-transparent to-white"></div>
             
             <h2 className="text-[22px] font-black text-[#4b7a7c] uppercase tracking-wider" style={{ fontFamily: 'Georgia, serif' }}>
                Parabéns, {nome.split(' ')[0]}!
             </h2>
           </div>
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

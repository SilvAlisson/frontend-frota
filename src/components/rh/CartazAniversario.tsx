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
      const blob = await htmlToImage.toBlob(cartazRef.current, {
        quality: 1,
        pixelRatio: 2,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          margin: '0'
        }
      });
      
      if (blob) {
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
      
      {/* ── CARTAZ (400x711 - Formato Stories/Status) ── */}
      <div 
        ref={cartazRef}
        className="relative overflow-hidden flex flex-col items-center bg-[#F8FAFC]"
        style={{
          width: '400px',
          height: '711px',
          boxSizing: 'border-box',
          fontFamily: '"Inter", "system-ui", sans-serif',
        }}
      >
        {/* ── BACKGROUND: Modern Gradient Blobs ── */}
        <div className="absolute top-[-10%] left-[-20%] w-[320px] h-[320px] bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 pointer-events-none"></div>
        <div className="absolute bottom-[10%] right-[-15%] w-[280px] h-[280px] bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 pointer-events-none"></div>
        <div className="absolute top-[35%] right-[-10%] w-[200px] h-[200px] bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60 pointer-events-none"></div>

        {/* Partículas brilhantes */}
        <div className="absolute top-16 left-12 opacity-40">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>

        {/* ── HEADER ── */}
        <div className="z-10 mt-[65px] text-center px-4 w-full relative">
          <div className="absolute -top-6 right-12 text-yellow-400/60 rotate-12">
            <Sparkles size={36} strokeWidth={1.5} />
          </div>
          <h1 className="font-black leading-[1.05] tracking-tighter" style={{ fontSize: '54px' }}>
            <span className="text-teal-900 drop-shadow-sm">FELIZ</span><br />
            <span className="text-teal-600 drop-shadow-sm">ANIVERSÁRIO</span>
          </h1>
        </div>

        {/* ── MOLDURA DA FOTO (Modern Style) ── */}
        <div className="relative z-20 mt-[35px]">
          {/* Card da foto com rotação elegante */}
          <div className="w-[250px] h-[250px] rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(13,148,136,0.15)] border-[6px] border-white rotate-3 bg-white relative transition-transform">
             <div 
               className="w-full h-full bg-cover bg-center" 
               style={{ 
                 backgroundImage: `url(${avatarImage})`,
                 transform: 'scale(1.02)' // Evita bordas fantasmas
               }}
             ></div>
          </div>

          {/* Enfeite: Ícone de bolo moderno no canto */}
          <div className="absolute -bottom-4 -left-5 bg-yellow-400 p-4 rounded-2xl shadow-xl -rotate-12 border-4 border-white flex items-center justify-center">
            <PartyPopper className="w-8 h-8 text-yellow-900" strokeWidth={2.5} />
          </div>
        </div>

        {/* ── MENSAGEM ── */}
        <div className="z-20 mt-[45px] px-8 text-center">
          <h2 className="text-[26px] font-extrabold text-slate-800 mb-3 tracking-tight">
            Parabéns, {nome.split(' ')[0]}! 🥳
          </h2>
          <p className="text-slate-600 font-medium leading-relaxed text-[15px] max-w-[300px] mx-auto">
            A equipe Klin deseja que seu dia seja incrivelmente especial, repleto de conquistas e muitas alegrias!
          </p>
        </div>

        {/* ── LOGO KLIN ── */}
        <div className="mt-auto mb-[35px] z-10 w-full flex justify-center">
          <img 
            src="/logo.png" 
            alt="KLIN" 
            className="h-[50px] object-contain mix-blend-multiply opacity-90" 
          />
        </div>

      </div>

      {/* ── BOTÕES DE AÇÃO ── */}
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

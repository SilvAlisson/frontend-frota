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
      
      {/* Container - Onde o design é montado */}
      <div 
        ref={cartazRef}
        className="relative overflow-hidden flex flex-col items-center"
        style={{
          width: '400px',
          height: '711px',
          background: 'linear-gradient(160deg, #c8f5e8 0%, #c5e4f7 45%, #d4d4f5 100%)',
          boxSizing: 'border-box'
        }}
      >
        {/* ── EMOJIS DECORATIVOS (z-index alto para ficarem na frente da foto) ── */}

        {/* 🧁 Cupcake - lado esquerdo, meio da tela */}
        <div
          className="absolute z-30 select-none"
          style={{ bottom: '210px', left: '-22px', fontSize: '120px', lineHeight: 1, filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.15))', transform: 'rotate(-8deg)' }}
        >🧁</div>

        {/* 🎈🎈 Dois balões - lado direito */}
        <div
          className="absolute z-30 select-none"
          style={{ bottom: '175px', right: '-12px', fontSize: '100px', lineHeight: 1, filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.15))', transform: 'rotate(12deg)' }}
        >🎈</div>
        <div
          className="absolute z-30 select-none"
          style={{ bottom: '270px', right: '35px', fontSize: '72px', lineHeight: 1, filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.15))', transform: 'rotate(-8deg)' }}
        >🎈</div>

        {/* ── HEADER: "Feliz Aniversário" com curvas estilo Canva ── */}
        <div className="relative z-10 text-center mt-10 px-4">
          <h1
            className="font-black leading-none tracking-tight"
            style={{
              fontFamily: '"Georgia", "Times New Roman", serif',
              color: '#0e7070',
              fontSize: '52px',
              lineHeight: '1.0',
              /* Texto levemente arqueado simulado por letter-spacing diferenciado */
              textShadow: '0 2px 4px rgba(0,0,0,0.08)'
            }}
          >
            <span style={{ fontSize: '44px', display: 'block' }}>Feliz</span>
            <span style={{ fontSize: '54px', display: 'block' }}>Aniversário</span>
          </h1>
        </div>

        {/* ── MOLDURA DA FOTO (Polaroid) ── */}
        {/* z-index 20: abaixo dos emojis (z-30), mas acima do fundo */}
        <div
          className="z-20 bg-white shadow-2xl relative"
          style={{
            marginTop: '24px',
            width: '272px',
            height: '304px',
            padding: '10px 10px 40px 10px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          }}
        >
          {/* 🎉 Chapeuzinho de festa em cima da cabeça do integrante (z-30, frente da foto) */}
          <div
            className="absolute z-30 select-none"
            style={{
              top: '-50px',
              left: '50%',
              transform: 'translateX(-60%) rotate(-10deg)',
              fontSize: '64px',
              lineHeight: 1,
              filter: 'drop-shadow(1px 2px 4px rgba(0,0,0,0.2))'
            }}
          >🎉</div>

          {/* Foto do integrante - z-index 10 (atrás dos emojis) */}
          <div
            className="z-10 w-full bg-slate-100 bg-cover bg-top"
            style={{
              height: '254px',
              backgroundImage: `url(${avatarImage})`,
            }}
          />
        </div>

        {/* ── FAIXA DE PARABÉNS (estilo pincelada branca) ── */}
        <div
          className="z-30 text-center"
          style={{
            marginTop: '24px',
            width: '370px',
            background: 'white',
            padding: '16px 28px',
            borderRadius: '12px 4px 10px 4px / 4px 10px 4px 12px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            transform: 'rotate(-0.5deg)',
          }}
        >
          <h2
            className="font-bold text-[#0e7070] mb-1"
            style={{ fontFamily: '"Georgia", serif', fontSize: '20px' }}
          >
            Parabéns, {nome.split(' ')[0]}!
          </h2>
          <p
            className="font-semibold text-[#2d8a8a]"
            style={{ fontSize: '13px', lineHeight: '1.45' }}
          >
            A equipe Klin deseja um feliz aniversário<br />e um dia repleto de coisas boas!
          </p>
        </div>

        {/* ── LOGO KLIN ── */}
        <div className="z-10 flex flex-col items-center" style={{ marginTop: '20px' }}>
          <img src="/logo.png" alt="KLIN" style={{ height: '52px', objectFit: 'contain', mixBlendMode: 'multiply', opacity: 0.95 }} />
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

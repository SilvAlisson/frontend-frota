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
      
      {/* ── CARTAZ (400x711) ── */}
      <div 
        ref={cartazRef}
        className="relative overflow-hidden flex flex-col items-center"
        style={{
          width: '400px',
          height: '711px',
          /* Gradiente fiel ao modelo: mint-verde na esquerda → azul-céu no meio → lavanda na direita */
          background: 'linear-gradient(to right, #C8F7DC 0%, #C0DAFE 50%, #E2D4F8 100%)',
          boxSizing: 'border-box',
          fontFamily: '"Georgia", "Times New Roman", serif',
        }}
      >

        {/* ══════════════════════════════════════════════
            HEADER "Feliz Aniversário"
            ══════════════════════════════════════════ */}
        <div
          style={{ marginTop: '40px', textAlign: 'center', zIndex: 10, position: 'relative' }}
        >
          <h1
            className="font-black"
            style={{
              color: '#087F8C',
              lineHeight: '0.9',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <span style={{ fontSize: '52px', display: 'block', letterSpacing: '-0.5px' }}>Feliz</span>
            <span style={{ fontSize: '66px', display: 'block', letterSpacing: '-1.5px', marginTop: '-4px' }}>Aniversário</span>
          </h1>
        </div>


        {/* ══════════════════════════════════════════════
            MOLDURA POLAROID & EMOJIS (z-20)
            ══════════════════════════════════════════ */}
        <div
          style={{
            position: 'relative',
            marginTop: '30px',
            width: '320px',         /* Largura ajustada para permitir foto quadrada */
            backgroundColor: 'white',
            padding: '12px 12px 64px 12px', /* Espaço extra embaixo típico de polaroid */
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            zIndex: 20,
          }}
        >
          {/* Foto — perfeitamente quadrada dentro da polaroid */}
          <div
            style={{
              width: '100%',
              height: '296px', /* 320 - 12 - 12 = 296 */
              backgroundImage: `url(${avatarImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
              backgroundColor: '#e2e8f0',
            }}
          />

          {/* ── EMOJIS DECORATIVOS (Relativos à polaroid) ── */}
          
          {/* 🎉 Chapeuzinho — topo central */}
          <div
            className="absolute select-none"
            style={{
              top: '-35px',
              left: '50%',
              transform: 'translateX(-50%) rotate(-10deg)',
              fontSize: '65px',
              lineHeight: 1,
              zIndex: 30,
              filter: 'drop-shadow(1px 3px 4px rgba(0,0,0,0.2))',
            }}
          >🎉</div>

          {/* 🧁 Cupcake — canto inferior esquerdo */}
          <div
            className="absolute select-none"
            style={{
              bottom: '-25px',
              left: '-45px',
              fontSize: '110px',
              lineHeight: 1,
              zIndex: 30,
              filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.2))',
              transform: 'rotate(-12deg)',
            }}
          >🧁</div>

          {/* 🎈 Balão Azul (hue-rotate) — canto inferior direito (fundo) */}
          <div
            className="absolute select-none"
            style={{
              bottom: '50px',
              right: '-45px',
              fontSize: '85px',
              lineHeight: 1,
              zIndex: 29,
              /* Hue-rotate transforma o vermelho padrão do balão em azul */
              filter: 'hue-rotate(200deg) drop-shadow(2px 4px 5px rgba(0,0,0,0.2))',
              transform: 'rotate(15deg)',
            }}
          >🎈</div>

          {/* 🎈 Balão Verde (hue-rotate) — canto inferior direito (frente) */}
          <div
            className="absolute select-none"
            style={{
              bottom: '-20px',
              right: '-15px',
              fontSize: '95px',
              lineHeight: 1,
              zIndex: 30,
              /* Hue-rotate transforma o vermelho padrão do balão em verde */
              filter: 'hue-rotate(120deg) drop-shadow(2px 4px 6px rgba(0,0,0,0.2))',
              transform: 'rotate(-10deg)',
            }}
          >🎈</div>
        </div>


        {/* ══════════════════════════════════════════════
            FAIXA PARABÉNS — z-10
            ══════════════════════════════════════════ */}
        <div
          style={{
            marginTop: '40px',
            width: '360px',
            background: 'white',
            padding: '18px 24px 20px 24px',
            /* border-radius irregular para imitar pincelada/brush stroke mais suave */
            borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            transform: 'rotate(-1deg)',
            textAlign: 'center',
            zIndex: 10,
          }}
        >
          <h2
            style={{
              color: '#087F8C',
              fontSize: '22px',
              fontWeight: 700,
              marginBottom: '6px',
              fontFamily: '"Georgia", serif',
            }}
          >
            Parabéns, {nome.split(' ')[0]}!
          </h2>
          <p
            style={{
              color: '#087F8C',
              fontSize: '14px',
              fontWeight: 600,
              lineHeight: '1.4',
              fontFamily: '"Georgia", serif',
            }}
          >
            A equipe Klin deseja um feliz aniversário<br />e um dia repleto de coisas boas!
          </p>
        </div>


        {/* ══════════════════════════════════════════════
            LOGO KLIN (Tamanho aumentado)
            ══════════════════════════════════════════ */}
        <div style={{ marginTop: 'auto', marginBottom: '20px', zIndex: 10 }}>
          <img
            src="/logo.png"
            alt="KLIN"
            style={{
              height: '85px', /* Tamanho bem maior conforme solicitado */
              objectFit: 'contain',
              mixBlendMode: 'multiply',
            }}
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

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
          /* Gradiente fiel ao modelo: mint-verde → azul-céu → lavanda suave */
          background: 'linear-gradient(150deg, #b2f0e4 0%, #a8d8f0 42%, #b8cef5 78%, #cbc8f0 100%)',
          boxSizing: 'border-box',
          fontFamily: '"Georgia", "Times New Roman", serif',
        }}
      >

        {/* ══════════════════════════════════════════════
            EMOJIS DECORATIVOS — z-30 (acima de TUDO)
            ══════════════════════════════════════════ */}

        {/* 🎉 Chapeuzinho — centralizado, logo acima da polaroid */}
        <div
          className="absolute select-none"
          style={{
            top: '158px',
            left: '50%',
            transform: 'translateX(-45%) rotate(-12deg)',
            fontSize: '70px',
            lineHeight: 1,
            zIndex: 30,
            filter: 'drop-shadow(1px 3px 6px rgba(0,0,0,0.22))',
          }}
        >🎉</div>

        {/* 🧁 Cupcake — canto inferior-esquerdo, sobrepõe a polaroid */}
        <div
          className="absolute select-none"
          style={{
            bottom: '190px',
            left: '-20px',
            fontSize: '128px',
            lineHeight: 1,
            zIndex: 30,
            filter: 'drop-shadow(2px 5px 10px rgba(0,0,0,0.18))',
            transform: 'rotate(-6deg)',
          }}
        >🧁</div>

        {/* 🎈 Balão maior — canto inferior-direito, sobrepõe a polaroid */}
        <div
          className="absolute select-none"
          style={{
            bottom: '210px',
            right: '-8px',
            fontSize: '98px',
            lineHeight: 1,
            zIndex: 30,
            filter: 'drop-shadow(2px 5px 10px rgba(0,0,0,0.18))',
            transform: 'rotate(10deg)',
          }}
        >🎈</div>

        {/* 🎈 Balão menor — levemente acima e à esquerda do maior */}
        <div
          className="absolute select-none"
          style={{
            bottom: '300px',
            right: '44px',
            fontSize: '64px',
            lineHeight: 1,
            zIndex: 30,
            filter: 'drop-shadow(1px 3px 6px rgba(0,0,0,0.15))',
            transform: 'rotate(-10deg)',
          }}
        >🎈</div>


        {/* ══════════════════════════════════════════════
            HEADER "Feliz Aniversário"
            ══════════════════════════════════════════ */}
        <div
          style={{ marginTop: '32px', textAlign: 'center', zIndex: 10, position: 'relative' }}
        >
          <h1
            className="font-black"
            style={{
              color: '#0a6b6b',
              lineHeight: '1.0',
              textShadow: '0 2px 8px rgba(0,0,0,0.09)',
            }}
          >
            <span style={{ fontSize: '48px', display: 'block', letterSpacing: '0px' }}>Feliz</span>
            <span style={{ fontSize: '62px', display: 'block', letterSpacing: '-1px', marginTop: '-2px' }}>Aniversário</span>
          </h1>
        </div>


        {/* ══════════════════════════════════════════════
            MOLDURA POLAROID — z-20 (atrás dos emojis)
            ══════════════════════════════════════════ */}
        <div
          style={{
            position: 'relative',
            marginTop: '16px',
            width: '352px',         /* ~88% da largura total */
            backgroundColor: 'white',
            padding: '10px 10px 50px 10px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
            zIndex: 20,
          }}
        >
          {/* Foto — fica DENTRO da polaroid, z-index menor naturalmente */}
          <div
            style={{
              width: '100%',
              height: '288px',
              backgroundImage: `url(${avatarImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
              backgroundColor: '#e2e8f0',
            }}
          />
        </div>


        {/* ══════════════════════════════════════════════
            FAIXA PARABÉNS — z-10
            ══════════════════════════════════════════ */}
        <div
          style={{
            marginTop: '18px',
            width: '368px',
            background: 'white',
            padding: '14px 24px 16px 24px',
            /* border-radius irregular para imitar pincelada */
            borderRadius: '6px 2px 8px 2px / 2px 6px 2px 8px',
            boxShadow: '0 2px 18px rgba(0,0,0,0.10)',
            transform: 'rotate(-0.5deg)',
            textAlign: 'center',
            zIndex: 10,
          }}
        >
          <h2
            style={{
              color: '#0a6b6b',
              fontSize: '21px',
              fontWeight: 700,
              marginBottom: '5px',
              fontFamily: '"Georgia", serif',
            }}
          >
            Parabéns, {nome.split(' ')[0]}!
          </h2>
          <p
            style={{
              color: '#1a8080',
              fontSize: '13.5px',
              fontWeight: 600,
              lineHeight: '1.5',
              fontFamily: '"Georgia", serif',
            }}
          >
            A equipe Klin deseja um feliz aniversário<br />e um dia repleto de coisas boas!
          </p>
        </div>


        {/* ══════════════════════════════════════════════
            LOGO KLIN
            ══════════════════════════════════════════ */}
        <div style={{ marginTop: '20px', zIndex: 10 }}>
          <img
            src="/logo.png"
            alt="KLIN"
            style={{
              height: '52px',
              objectFit: 'contain',
              mixBlendMode: 'multiply',
              opacity: 0.95,
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

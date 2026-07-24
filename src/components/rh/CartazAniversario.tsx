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
        fontEmbedCSS: '',
        skipFonts: true,
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
        pixelRatio: 2,
        fontEmbedCSS: '',
        skipFonts: true
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
          background: 'linear-gradient(to right, #C8F7DC 0%, #C0DAFE 50%, #E2D4F8 100%)',
          boxSizing: 'border-box',
          fontFamily: '"Georgia", "Times New Roman", serif',
        }}
      >

        {/* ══════════════════════════════════════════════
            HEADER "Feliz Aniversário" (Com Curvatura via SVG)
            ══════════════════════════════════════════ */}
        <div style={{ marginTop: '15px', zIndex: 10, width: '400px', height: '140px', position: 'relative' }}>
          <svg width="400" height="150" viewBox="0 0 400 150">
            {/* Path invisível para curvar o "Feliz" */}
            <path id="curveFeliz" d="M 120 70 Q 200 45 280 70" fill="transparent" />
            <text>
              <textPath href="#curveFeliz" startOffset="50%" textAnchor="middle" fill="#087F8C" style={{ fontFamily: '"Georgia", serif', fontSize: '46px', fontWeight: 900 }}>
                Feliz
              </textPath>
            </text>
            
            {/* Path invisível para curvar o "Aniversário" */}
            <path id="curveAniversario" d="M 35 135 Q 200 85 365 135" fill="transparent" />
            <text>
              <textPath href="#curveAniversario" startOffset="50%" textAnchor="middle" fill="#087F8C" style={{ fontFamily: '"Georgia", serif', fontSize: '58px', fontWeight: 900 }}>
                Aniversário
              </textPath>
            </text>
          </svg>
        </div>


        {/* ══════════════════════════════════════════════
            MOLDURA POLAROID & EMOJIS (z-20)
            ══════════════════════════════════════════ */}
        <div
          style={{
            position: 'relative',
            marginTop: '15px',
            width: '320px',
            backgroundColor: 'white',
            padding: '12px 12px 64px 12px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            zIndex: 20,
          }}
        >
          {/* 🎉 Chapeuzinho VETORIZADO - No TOPO da moldura Polaroid (fora da cabeça) */}
          <div
            className="absolute select-none"
            style={{
              top: '-35px',
              left: '50%',
              transform: 'translateX(-50%) rotate(10deg)',
              zIndex: 35,
              filter: 'drop-shadow(2px 4px 4px rgba(0,0,0,0.3))',
            }}
          >
            <svg width="70" height="90" viewBox="0 0 80 90" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <clipPath id="hatClip">
                  <path d="M 40 15 L 15 80 L 65 80 Z" />
                </clipPath>
              </defs>
              <path d="M 40 15 L 15 80 L 65 80 Z" fill="#FACC15" />
              <g clipPath="url(#hatClip)">
                <rect x="0" y="30" width="80" height="10" fill="#EA580C" transform="rotate(10, 40, 35)" />
                <rect x="0" y="55" width="80" height="12" fill="#EA580C" transform="rotate(10, 40, 60)" />
              </g>
              <path d="M 40 2 L 43 10 L 51 10 L 45 15 L 47 23 L 40 18 L 33 23 L 35 15 L 29 10 L 37 10 Z" fill="#1D4ED8" />
            </svg>
          </div>

          {/* Foto do integrante */}
          <div
            style={{
              width: '100%',
              height: '296px',
              backgroundImage: `url(${avatarImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
              backgroundColor: '#e2e8f0',
            }}
          />

          {/* 🧁 Cupcake — borda inferior-esquerda */}
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

          {/* 🎈 Balão Azul — fundo direita */}
          <div
            className="absolute select-none"
            style={{
              bottom: '50px',
              right: '-45px',
              fontSize: '85px',
              lineHeight: 1,
              zIndex: 29,
              filter: 'hue-rotate(200deg) drop-shadow(2px 4px 5px rgba(0,0,0,0.2))',
              transform: 'rotate(15deg)',
            }}
          >🎈</div>

          {/* 🎈 Balão Verde — frente direita */}
          <div
            className="absolute select-none"
            style={{
              bottom: '-20px',
              right: '-15px',
              fontSize: '95px',
              lineHeight: 1,
              zIndex: 30,
              filter: 'hue-rotate(120deg) drop-shadow(2px 4px 6px rgba(0,0,0,0.2))',
              transform: 'rotate(-10deg)',
            }}
          >🎈</div>
        </div>


        {/* ══════════════════════════════════════════════
            FAIXA PARABÉNS — z-10 (Com fundo pincelado SVG)
            ══════════════════════════════════════════ */}
        <div style={{ position: 'relative', width: '370px', height: '110px', marginTop: '15px', zIndex: 10 }}>
          {/* Fundo Pincelado em SVG */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))' }} viewBox="0 0 360 110" preserveAspectRatio="none">
            {/* Forma principal irregular */}
            <path d="M 12 15 C 50 10, 310 10, 348 18 C 358 25, 362 85, 350 95 C 310 105, 50 105, 12 95 C -2 85, -2 25, 12 15 Z" fill="white" />
            {/* Pinceladas extras nas bordas para dar efeito rasgado/brush */}
            <path d="M 5 25 C 100 20, 260 20, 355 30 C 355 30, 355 40, 345 50 C 260 45, 100 45, 10 35 Z" fill="white" />
            <path d="M 10 70 C 100 65, 260 65, 350 75 C 350 75, 350 85, 340 95 C 260 90, 100 90, 5 80 Z" fill="white" />
          </svg>
          
          {/* Texto */}
          <div style={{ position: 'relative', zIndex: 1, padding: '22px 24px', textAlign: 'center', transform: 'rotate(-1deg)' }}>
            <h2
              style={{
                color: '#087F8C',
                fontSize: '22px',
                fontWeight: 700,
                marginBottom: '4px',
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
        </div>


        {/* ══════════════════════════════════════════════
            LOGO KLIN 
            ══════════════════════════════════════════ */}
        <div style={{ marginTop: 'auto', marginBottom: '15px', zIndex: 10 }}>
          <img
            src="/logo.png"
            alt="KLIN"
            style={{
              height: '75px', 
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

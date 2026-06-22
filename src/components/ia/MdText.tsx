import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CarFront } from 'lucide-react';

// ============================================================================
// 🚗 WIDGET: Cartão de veículo clicável — renderizado inline no chat
// ============================================================================
const WidgetVeiculo = ({ placa }: { placa: string }) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/admin/veiculos/${placa}`)}
      className="mt-3 mb-3 p-3.5 bg-surface-hover border border-border/80 rounded-xl flex items-center gap-4 shadow-sm hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group active:scale-[0.98]"
    >
      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
        <CarFront className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm text-text-main uppercase tracking-wider">{placa}</h4>
        <p className="text-[11px] text-text-muted truncate">Clique para abrir o dossiê completo</p>
      </div>
      <div className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shrink-0 pr-1">
        Abrir &rarr;
      </div>
    </div>
  );
};

// ============================================================================
// 📝 MDTEXT: Renderizador de Markdown leve
// Suporta: **negrito**, ### títulos, - bullet points, [WIDGET:VEICULO:PLACA]
// ============================================================================

/** Renderiza uma linha de texto convertendo **negrito** em <strong> */
function renderizarNegrito(linha: string): React.ReactNode[] {
  return linha.split(/(\*\*[^*]+\*\*)/g).map((parte, i) =>
    parte.startsWith('**') && parte.endsWith('**') ? (
      <strong key={i} className="font-bold text-text-main">
        {parte.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{parte}</span>
    )
  );
}

interface MdTextProps {
  texto: string;
  /** Se true, renderiza widgets interativos de veículo. Padrão: false */
  comWidgets?: boolean;
}

export const MdText = React.memo(({ texto, comWidgets = false }: MdTextProps) => {
  // Separa o texto em blocos: partes normais e widgets [WIDGET:VEICULO:PLACA]
  const blocos = comWidgets
    ? texto.split(/(\[WIDGET:VEICULO:[^\]]+\])/g)
    : [texto];

  return (
    <div className="space-y-1.5 text-sm leading-relaxed whitespace-pre-wrap word-break">
      {blocos.map((bloco, idx) => {
        // Renderiza widgets de veículo
        if (comWidgets && bloco.startsWith('[WIDGET:VEICULO:')) {
          const placa = bloco.replace('[WIDGET:VEICULO:', '').replace(']', '');
          return <WidgetVeiculo key={`widget-${idx}`} placa={placa} />;
        }

        if (!bloco.trim()) return null;

        // Renderiza as linhas do bloco de texto
        const linhas = bloco.split('\n');
        return (
          <React.Fragment key={`block-${idx}`}>
            {linhas.map((linha, i) => {
              // Linha vazia → espaçamento
              if (!linha.trim()) {
                return <br key={`br-${i}`} className="select-none" />;
              }

              // ### Título (nível 3)
              if (linha.trim().startsWith('### ')) {
                const conteudo = linha.trim().slice(4);
                return (
                  <div key={`h3-${i}`} className="font-black text-text-main text-sm pt-2 pb-0.5 border-b border-border/40">
                    {renderizarNegrito(conteudo)}
                  </div>
                );
              }

              // ## Título (nível 2)
              if (linha.trim().startsWith('## ')) {
                const conteudo = linha.trim().slice(3);
                return (
                  <div key={`h2-${i}`} className="font-black text-text-main text-base pt-3 pb-1">
                    {renderizarNegrito(conteudo)}
                  </div>
                );
              }

              // Bullet point: *, - ou •
              const isBullet =
                linha.trim().startsWith('* ') ||
                linha.trim().startsWith('- ') ||
                linha.trim().startsWith('• ');

              if (isBullet) {
                const conteudo = linha.trim().slice(2);
                return (
                  <div key={`bullet-${i}`} className="flex gap-2 items-start pl-1">
                    <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-primary/80 shrink-0" aria-hidden="true" />
                    <span>{renderizarNegrito(conteudo)}</span>
                  </div>
                );
              }

              // Linha normal
              return (
                <div key={`line-${i}`}>{renderizarNegrito(linha)}</div>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
});

MdText.displayName = 'MdText';

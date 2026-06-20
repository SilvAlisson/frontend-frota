import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export interface PrintUser {
  id: string;
  nome: string;
  matricula?: string | null;
  cargo?: string | null;
}

interface FolhaImpressaoQRCodesProps {
  usuarios: PrintUser[];
}

export function FolhaImpressaoQRCodes({ usuarios }: FolhaImpressaoQRCodesProps) {
  // Configurações da folha A4 e grade
  // A4 = 210mm x 297mm.
  // Vamos usar um grid responsivo que funciona bem para @media print
  
  if (!usuarios || usuarios.length === 0) return null;

  const urlBase = window.location.origin + '/dossie/';

  return (
    <div className="hidden print:block fixed inset-0 bg-white z-[9999] overflow-visible">
      <style>
        {`
          @page {
            size: A4;
            margin: 10mm;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              background-color: white !important;
            }
            .no-print {
              display: none !important;
            }
            .print-page-break {
              page-break-after: always;
            }
          }
        `}
      </style>

      <div className="w-full h-full bg-white text-black p-4">
        <h1 className="text-center font-bold text-2xl mb-6">Etiquetas de Capacetes - Dossiê Digital</h1>
        
        <div className="grid grid-cols-3 gap-6 auto-rows-max">
          {usuarios.map((user, index) => {
            const qrUrl = `${urlBase}${user.id}`;
            // Força quebra de página a cada 15 etiquetas (3 colunas x 5 linhas = 15 por folha)
            const isPageBreak = (index + 1) % 15 === 0;

            return (
              <React.Fragment key={user.id}>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-400 p-4 rounded-xl relative break-inside-avoid">
                  {/* Tesoura icon hint - top left */}
                  <span className="absolute -top-3 -left-2 text-gray-400 text-lg">✂️</span>
                  
                  <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                    <QRCodeSVG 
                      value={qrUrl} 
                      size={120} 
                      level="H" 
                      includeMargin={false} 
                    />
                  </div>
                  
                  <div className="mt-3 text-center w-full">
                    <p className="font-bold text-[14px] leading-tight line-clamp-2 uppercase">
                      {user.nome.split(' ').slice(0, 2).join(' ')}
                    </p>
                    {user.cargo && (
                      <p className="text-[10px] text-gray-600 font-semibold uppercase mt-1 truncate">
                        {user.cargo}
                      </p>
                    )}
                    {user.matricula && (
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        MAT: {user.matricula}
                      </p>
                    )}
                  </div>
                </div>
                {isPageBreak && <div className="print-page-break col-span-3"></div>}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

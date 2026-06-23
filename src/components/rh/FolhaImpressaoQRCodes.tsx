import React from 'react';
import { createPortal } from 'react-dom';
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

  return createPortal(
    <div id="print-container" className="hidden print:block absolute top-0 left-0 w-full bg-white z-[9999] min-h-screen">
      <style>
        {`
          @page {
            size: A4;
            margin: 10mm;
          }
          @media print {
            /* Esconde toda a interface do app (incluindo modals) e mostra apenas o contêiner de impressão */
            body > :not(#print-container) {
              display: none !important;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              background-color: white !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      <div className="w-full bg-white text-black pt-2 pb-4 px-4">
        <h1 className="text-center font-bold text-2xl mb-6">Etiquetas de Capacetes - Dossiê Digital</h1>
        
        {/* Usamos grid normal. O break-inside-avoid no filho cuida da paginação automática! */}
        <div className="grid grid-cols-3 gap-6 auto-rows-max">
          {usuarios.map((user) => {
            const qrUrl = `${urlBase}${user.id}`;
            const nameParts = user.nome.trim().split(' ');
            const firstName = nameParts[0];
            const restName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

            return (
              <div key={user.id} className="flex flex-col items-center justify-center border-2 border-dashed border-gray-400 p-4 rounded-xl relative break-inside-avoid">
                {/* Tesoura icon hint - top left */}
                <span className="absolute -top-3 -left-2 text-gray-400 text-lg">✂️</span>
                
                <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                  <QRCodeSVG 
                    value={qrUrl} 
                    size={160} 
                    level="H" 
                    includeMargin={false} 
                  />
                </div>
                
                <div className="mt-3 text-center w-full overflow-hidden px-1">
                  <p className="font-bold text-[16px] leading-tight uppercase truncate">
                    {firstName}
                  </p>
                  {restName && (
                    <p className="font-bold text-[13px] text-gray-800 leading-tight uppercase truncate mt-0.5">
                      {restName}
                    </p>
                  )}
                  {user.cargo && (
                    <p className="text-[11px] text-gray-600 font-semibold uppercase mt-1 truncate">
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
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}

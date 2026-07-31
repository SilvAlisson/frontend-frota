import { QrCode, Printer } from 'lucide-react';
import { Button } from '../../ui/Button';

interface CrachaModalProps {
    usuario: { nome: string; id: string };
    qrCodeImageUrl: string;
    onClose: () => void;
}

export function CrachaModal({ usuario, qrCodeImageUrl, onClose }: CrachaModalProps) {
    const handleImprimirEtiqueta = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        printWindow.document.write(`
            <html>
                <head>
                    <title>Etiqueta Capacete — ${usuario.nome}</title>
                    <style>
                        @media print {
                            @page { margin: 0; size: auto; }
                            body { margin: 0; -webkit-print-color-adjust: exact; }
                        }
                        body {
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            font-family: 'Inter', Arial, sans-serif;
                            background: #fff;
                        }
                        .etiqueta {
                            text-align: center;
                            border: 2px solid #000;
                            padding: 15px;
                            border-radius: 8px;
                            width: fit-content;
                        }
                    </style>
                </head>
                <body>
                    <div class="etiqueta">
                        <h2 style="margin: 0 0 10px 0; font-size: 16px; font-weight: 900;">FROTA KLIN</h2>
                        <img src="${qrCodeImageUrl}" style="width: 140px; height: 140px; display: block; margin: 0 auto;" />
                        <p style="margin: 10px 0 0 0; font-size: 14px; font-weight: bold; text-transform: uppercase;">${usuario.nome}</p>
                        <p style="margin: 5px 0 0 0; font-size: 10px; color: #333; font-weight: bold;">AUDITORIA DE SSMA</p>
                    </div>
                    <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
                </body>
            </html>
        `);
    };

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-surface p-8 rounded-[2rem] max-w-sm w-full mx-auto flex flex-col items-center text-center shadow-2xl border border-border/40 animate-in zoom-in-95 duration-300"
                onClick={e => e.stopPropagation()}
            >
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4">
                    <QrCode className="w-6 h-6" />
                </div>

                <h2 className="text-xl font-black text-text-main uppercase tracking-tight mb-2">
                    Crachá de Conformidade
                </h2>
                <p className="text-sm text-text-muted mb-6">
                    Escaneie para acessar o dossiê público de{' '}
                    <strong>{usuario.nome}</strong> com a validade de todos os treinamentos.
                </p>

                <div className="bg-white p-3 rounded-2xl shadow-inner mb-8 border border-border/40">
                    <img
                        src={qrCodeImageUrl}
                        alt={`QR Code do dossiê de ${usuario.nome}`}
                        className="w-48 h-48 rounded-xl"
                    />
                </div>

                <div className="flex gap-3 w-full">
                    <Button
                        variant="secondary"
                        className="flex-1 h-12 font-black uppercase tracking-widest text-xs"
                        onClick={onClose}
                    >
                        Fechar
                    </Button>
                    <Button
                        variant="primary"
                        className="flex-1 h-12 font-black uppercase tracking-widest text-xs shadow-button hover:shadow-float-primary"
                        onClick={handleImprimirEtiqueta}
                        icon={<Printer className="w-4 h-4" />}
                    >
                        Imprimir
                    </Button>
                </div>
            </div>
        </div>
    );
}

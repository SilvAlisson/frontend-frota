import { useState } from 'react';
import { api } from '../services/api';
import { Button } from './ui/Button';
import { toast } from 'sonner';
import { Ghost, AlertTriangle } from 'lucide-react';

interface Props {
    veiculoId: string;
    onSuccess?: () => void;
    className?: string; // Para facilitar posicionamento no layout
}

export function BotaoLimparFantasmas({ veiculoId, onSuccess, className }: Props) {
    const [loading, setLoading] = useState(false);
    const [confirmando, setConfirmando] = useState(false);

    const handleExorcismo = async () => {
        try {
            setLoading(true);

            // Chama a rota do backend que deleta as jornadas "bugadas"
            const { data } = await api.delete(`/veiculos/${veiculoId}/fantasmas`);

            toast.success(
                <div className="flex flex-col gap-1">
                    <span className="font-bold">Limpeza Concluída! 🧹</span>
                    <span className="text-xs">
                        {data.count || 'Registros'} fantasmas foram removidos.
                    </span>
                </div>
            );

            setConfirmando(false);
            if (onSuccess) onSuccess();

        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.error || "Erro ao tentar limpar jornadas.");
        } finally {
            setLoading(false);
        }
    };

    if (confirmando) {
        return (
            <div className={`flex flex-col gap-2 p-2 bg-red-50 border border-red-200 rounded-lg animate-in fade-in zoom-in-95 shadow-sm ${className}`}>
                <div className="flex items-center gap-1.5 text-red-800 font-bold text-[10px] uppercase tracking-wider">
                    <AlertTriangle className="w-3 h-3" />
                    Apagar Automáticos?
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setConfirmando(false)}
                        className="flex-1 py-1 bg-white border border-red-200 text-red-700 rounded text-xs font-bold hover:bg-red-50 transition-colors"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleExorcismo}
                        disabled={loading}
                        className="flex-1 py-1 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700 shadow-sm flex items-center justify-center gap-1 transition-colors"
                    >
                        {loading ? '...' : 'Confirmar'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <Button
            type="button"
            variant="ghost"
            onClick={() => setConfirmando(true)}
            className={`border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-300 transition-all h-9 px-3 ${className}`}
            title="Limpar registros automáticos (Fantasmas)"
        >
            <div className="flex items-center gap-2">
                <Ghost className="w-4 h-4" />
                <span className="text-xs font-bold uppercase hidden sm:inline">Limpar Fantasmas</span>
            </div>
        </Button>
    );
}
import { useState, useMemo } from 'react';
import type { User } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Printer, Search, CheckSquare, Square } from 'lucide-react';
import { FolhaImpressaoQRCodes, type PrintUser } from './FolhaImpressaoQRCodes';
import { Input } from '../ui/Input';

interface ModalGerarEtiquetasProps {
  usuarios: User[];
  onClose: () => void;
}

export function ModalGerarEtiquetas({ usuarios, onClose }: ModalGerarEtiquetasProps) {
  // Filtramos apenas quem faz sentido ter etiqueta no capacete (Operador e Encarregado)
  // Mas vamos deixar flexível, começando com eles pré-filtrados
  const usuariosElegiveis = useMemo(() => {
    return usuarios.filter(u => u.role === 'OPERADOR' || u.role === 'ENCARREGADO');
  }, [usuarios]);

  const [busca, setBusca] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(usuariosElegiveis.map(u => u.id)));

  const usuariosFiltrados = useMemo(() => {
    if (!busca) return usuariosElegiveis;
    const termo = busca.toLowerCase();
    return usuariosElegiveis.filter(u => 
      u.nome.toLowerCase().includes(termo) || 
      (u.matricula && u.matricula.toLowerCase().includes(termo)) ||
      u.role.toLowerCase().includes(termo)
    );
  }, [usuariosElegiveis, busca]);

  const handleToggleSelectAll = () => {
    if (selectedIds.size === usuariosFiltrados.length) {
      setSelectedIds(new Set()); // Desmarca todos visíveis
    } else {
      setSelectedIds(new Set(usuariosFiltrados.map(u => u.id))); // Marca todos visíveis
    }
  };

  const handleToggleUser = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleImprimir = () => {
    // Dá um tempo curto para o React garantir o render da grade oculta
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const selectedUsersToPrint: PrintUser[] = useMemo(() => {
    return usuariosElegiveis
      .filter(u => selectedIds.has(u.id))
      .map(u => ({
        id: u.id,
        nome: u.nome,
        matricula: u.matricula,
        cargo: u.role
      }));
  }, [usuariosElegiveis, selectedIds]);

  const allSelected = selectedIds.size === usuariosFiltrados.length && usuariosFiltrados.length > 0;

  return (
    <>
      <Modal isOpen={true} onClose={onClose} title="Gerar Etiquetas de Capacetes" className="max-w-2xl">
        <div className="flex flex-col h-full gap-4">
          <p className="text-sm text-text-secondary">
            Selecione os integrantes para gerar a grade de QR Codes (Dossiê).
          </p>

          {/* Filtros */}
          <div className="flex gap-4 items-center shrink-0">
            <div className="flex-1">
              <Input 
                placeholder="Buscar por nome, matrícula ou cargo..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                icon={<Search className="w-4 h-4 text-text-muted" />}
                containerClassName="!mb-0"
              />
            </div>
            <Button 
              variant="secondary" 
              onClick={handleToggleSelectAll}
              className="whitespace-nowrap"
            >
              {allSelected ? <Square className="w-4 h-4 mr-2" /> : <CheckSquare className="w-4 h-4 mr-2" />}
              {allSelected ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </Button>
          </div>

          {/* Lista */}
          <div className="overflow-y-auto min-h-[300px] max-h-[50vh] border border-border/50 rounded-xl bg-surface-hover/20">
            {usuariosFiltrados.length === 0 ? (
              <div className="flex items-center justify-center h-full text-text-muted">
                Nenhum integrante encontrado.
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {usuariosFiltrados.map(user => (
                  <div 
                    key={user.id}
                    onClick={() => handleToggleUser(user.id)}
                    className="flex items-center justify-between p-3 hover:bg-surface-hover cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-primary">
                        {selectedIds.has(user.id) ? (
                          <CheckSquare className="w-5 h-5" />
                        ) : (
                          <Square className="w-5 h-5 text-text-muted" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-text-main leading-none">{user.nome}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs text-text-secondary uppercase">{user.role}</span>
                          {user.matricula && (
                            <span className="text-xs font-mono text-text-muted bg-surface-hover px-1 rounded border border-border/50">
                              {user.matricula}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="mt-2 flex justify-end gap-3 shrink-0 pt-4 border-t border-border/50">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleImprimir}
              disabled={selectedIds.size === 0}
              icon={<Printer className="w-4 h-4" />}
            >
              Gerar Impressão ({selectedIds.size})
            </Button>
          </div>
        </div>
      </Modal>

      {/* Componente Oculto de Impressão */}
      <FolhaImpressaoQRCodes usuarios={selectedUsersToPrint} />
    </>
  );
}

// frontend/src/components/IniciarJornada.tsx
// ATUALIZADO: Agora usa o Modal de Foto, igual ao fluxo de Finalizar/Abastecer.

import { useState } from 'react';
// import axios from 'axios'; // <-- 1. REMOVIDO (não é mais usado aqui)

// <-- 2. IMPORTAR O MODAL
import { ModalConfirmacaoFoto } from './ModalConfirmacaoFoto'; 

// Interfaces (tipagem)
interface IniciarJornadaProps {
  token: string;
  usuarios: any[]; 
  veiculos: any[];
  operadorLogadoId: string; 
  onJornadaIniciada: (novaJornada: any) => void;
  jornadasAtivas: any[]; 
}

// Classes reutilizáveis do Tailwind
const inputStyle = "shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-klin-azul focus:border-transparent disabled:bg-gray-200";
const buttonStyle = "bg-klin-azul hover:bg-klin-azul-hover text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";
const labelStyle = "block text-gray-700 text-sm font-bold mb-2";

export function IniciarJornada({ 
  token, 
  usuarios, 
  veiculos, 
  operadorLogadoId,
  onJornadaIniciada,
  jornadasAtivas
}: IniciarJornadaProps) {

  const [veiculoId, setVeiculoId] = useState('');
  const [encarregadoId, setEncarregadoId] = useState('');
  const [kmInicio, setKmInicio] = useState('');
  // const [fotoInicio, setFotoInicio] = useState<File | null>(null); // <-- 3. REMOVIDO
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [avisoVeiculo, setAvisoVeiculo] = useState('');

  // <-- 4. ADICIONADOS ESTADOS DO MODAL
  const [modalAberto, setModalAberto] = useState(false);
  const [formDataParaModal, setFormDataParaModal] = useState<any>(null);
  
  const isEsteVeiculoJaAberto = jornadasAtivas.some(j => j.veiculoId === veiculoId);

  // handleVeiculoChange (sem alteração, continua como estava)
  const handleVeiculoChange = (veiculoIdSelecionado: string) => {
    setVeiculoId(veiculoIdSelecionado);
    setAvisoVeiculo(''); 
    if (!veiculoIdSelecionado) return;
    const jornadaNossaEsteVeiculo = jornadasAtivas.find(j => j.veiculoId === veiculoIdSelecionado);
    if (jornadaNossaEsteVeiculo) {
        setAvisoVeiculo(`Você já está com esta jornada aberta (Início: ${jornadaNossaEsteVeiculo.kmInicio} KM).`);
        return; 
    }
  };

  // <-- 5. handleSubmit ATUALIZADO (agora só valida e abre o modal)
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true); 
    setError('');
    setSuccess('');

    if (isEsteVeiculoJaAberto) {
       setError(`Você já iniciou uma jornada com este veículo. Finalize-a na coluna ao lado.`);
       setLoading(false);
       return;
    }
    if (!veiculoId || !encarregadoId || !kmInicio) {
      setError('Veículo, Encarregado e KM Inicial são obrigatórios.');
      setLoading(false);
      return;
    }
    // if (!fotoInicio) { ... } // <-- Validação de foto REMOVIDA
    
    const kmInicioFloat = parseFloat(kmInicio);
    if (isNaN(kmInicioFloat) || kmInicioFloat <= 0) {
        setError('O KM Inicial deve ser um número válido e positivo.');
        setLoading(false);
        return;
    }

    // A lógica de 'axios' e 'formData' foi REMOVIDA daqui

    try {
      // Prepara os dados para o modal
      const dadosCompletosDoFormulario = {
        veiculoId: veiculoId,
        operadorId: operadorLogadoId,
        encarregadoId: encarregadoId, 
        kmInicio: kmInicioFloat,
        // fotoInicioUrl será adicionado pelo modal
      };
      
      setFormDataParaModal(dadosCompletosDoFormulario);
      setModalAberto(true); // Abre o modal
      
    } catch (err) {
      console.error("Erro ao preparar dados:", err);
      setError('Falha ao preparar dados para envio.');
    } finally {
      setLoading(false);
    }
  };

  // <-- 6. ADICIONADO Callback de sucesso do modal
  const handleModalSuccess = (novaJornada: any) => {
    setSuccess('Jornada iniciada com sucesso!');
    onJornadaIniciada(novaJornada);
    
    // Limpa o modal
    setModalAberto(false);
    setFormDataParaModal(null);
      
    // Limpa o formulário
    setVeiculoId('');
    setEncarregadoId('');
    setKmInicio('');
    setAvisoVeiculo('');
  };


  return (
    // <-- 7. ADICIONADO Fragment (<>) para englobar o modal
    <>
      <form 
        className="bg-transparent space-y-4 relative"
        onSubmit={handleSubmit}
      >
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
            <svg className="animate-spin h-8 w-8 text-klin-azul" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}

        <h3 className="text-xl font-semibold text-klin-azul text-center">
          Iniciar Nova Jornada
        </h3>

        {/* Campo Veículo (sem alteração) */}
        <div>
          <label className={labelStyle}>Veículo (Placa)</label>
          <select 
              className={inputStyle} 
              value={veiculoId} 
              onChange={(e) => handleVeiculoChange(e.target.value)}
              disabled={loading}
          >
            <option value="">Selecione um veículo...</option>
            {veiculos.map(v => (
              <option key={v.id} value={v.id}>
                {v.placa} ({v.modelo})
              </option>
            ))}
          </select>
        </div>

        {/* Campo Encarregado (sem alteração) */}
        <div>
          <label className={labelStyle}>Encarregado</label>
          <select className={inputStyle} value={encarregadoId} onChange={(e) => setEncarregadoId(e.target.value)} disabled={loading}>
            <option value="">Selecione um encarregado...</option>
            {usuarios
              .filter(u => u.role === 'ENCARREGADO') 
              .map(u => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
          </select>
        </div>

        {/* Campo KM Inicial (sem alteração) */}
        <div>
          <label className={labelStyle}>KM Inicial</label>
          <input 
            type="number" 
            placeholder="Ex: 19000"
            className={inputStyle}
            value={kmInicio}
            onChange={(e) => setKmInicio(e.target.value)}
            disabled={loading}
          />
        </div>
        
        {/* <-- 8. REMOVIDO Bloco da Foto
        <div>
          <label className={labelStyle}>Foto do Odómetro (Início)</label>
          <input type="file" ... />
        </div>
        */}
        
        {avisoVeiculo && (
          <p className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded text-center text-sm">
            {avisoVeiculo}
          </p>
        )}
        {error && (
          <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center text-sm">
            {error}
          </p>
        )}
        {success && (
          <p className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-center text-sm">
            {success}
          </p>
        )}

        <button 
          type="submit" 
          className={buttonStyle}
          // <-- 9. ATUALIZADO: Remoção do '!fotoInicio' da validação
          disabled={loading || !veiculoId || !encarregadoId || !kmInicio || isEsteVeiculoJaAberto} 
        >
          {loading ? 'Validando...' : 'Iniciar Jornada'}
        </button>

        {isEsteVeiculoJaAberto && (
            <p className="text-center text-sm text-red-700 font-medium">
                Você já está com este veículo. Finalize a jornada ao lado.
            </p>
        )}
      </form>

      {/* <-- 10. ADICIONADO: Renderização do Modal --> */}
      {modalAberto && formDataParaModal && (
        <ModalConfirmacaoFoto
          token={token}
          titulo="Confirmar Início de Jornada"
          
          // O modal de foto precisa do KM para exibir na confirmação
          kmParaConfirmar={parseFloat(kmInicio)} 
          
          // Dados que o modal precisa para enviar o POST
          dadosJornada={formDataParaModal} 
          apiEndpoint="/jornada/iniciar" // API de destino
          apiMethod="POST"
          
          jornadaId={null} // Não aplicável ao iniciar

          // Callbacks
          onClose={() => setModalAberto(false)}
          onSuccess={handleModalSuccess} 
        />
      )}
    </>
  );
}
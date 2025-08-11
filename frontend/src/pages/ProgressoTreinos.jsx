import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, TrophyIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import GraficoEvolucao from '../components/GraficoEvolucao';
import DestaquesTreinos from '../components/DestaquesTreinos';
import MetasTreinos from '../components/MetasTreinos';

export default function ProgressoTreinos() {
    const [historico, setHistorico] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const navigate = useNavigate();

    // Simulação de dados de API
    useEffect(() => {
        const carregarDados = async () => {
            // Substituir por chamada real à API
            const dadosMockados = [
                { data: '2023-10-01', exercicio: 'Supino', carga: 50, reps: 12 },
                { data: '2023-10-08', exercicio: 'Supino', carga: 55, reps: 10 },
                { data: '2023-10-15', exercicio: 'Supino', carga: 60, reps: 8 },
                // ... mais dados
            ];
            setHistorico(dadosMockados);
            setCarregando(false);
        };
        carregarDados();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <header className="mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-blue-600 hover:text-blue-800"
                >
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    Voltar
                </button>
                <h1 className="text-3xl font-bold text-gray-900 mt-4">Meu Progresso</h1>
                <p className="text-gray-600">Acompanhe sua evolução nos treinos</p>
            </header>

            {carregando ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Gráfico de Evolução */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm">
                        <h2 className="text-xl font-semibold mb-4 flex items-center">
                            <ChartBarIcon className="h-6 w-6 text-blue-500 mr-2" />
                            Evolução de Cargas
                        </h2>
                        <GraficoEvolucao dados={historico} />
                    </div>

                    {/* Destaques e Metas */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <h2 className="text-xl font-semibold mb-4 flex items-center">
                                <TrophyIcon className="h-6 w-6 text-yellow-500 mr-2" />
                                Seus Destaques
                            </h2>
                            <DestaquesTreinos historico={historico} />
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <h2 className="text-xl font-semibold mb-4">Próximas Metas</h2>
                            <MetasTreinos />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
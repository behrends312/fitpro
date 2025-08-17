import React, { useEffect, useState } from "react";
import { ClockIcon, CheckIcon } from "@radix-ui/react-icons";

export default function TreinoAtual() {
    const [exercicios, setExercicios] = useState([
        { nome: "Agachamento Livre", series: "4x12", concluido: true },
        { nome: "Leg Press", series: "3x15", concluido: true },
        { nome: "Cadeira Extensora", series: "3x12", concluido: true },
        { nome: "Stiff", series: "4x10", concluido: false },
        { nome: "Afundo", series: "3x10", concluido: false },
        { nome: "Panturrilha", series: "4x15", concluido: false },
        { nome: "Agachamento Sumô", series: "3x12", concluido: false }
    ]);
    const [treinoConcluido, setTreinoConcluido] = useState(false);

    const toggleConcluido = (index) => {
        const novosExercicios = [...exercicios];
        novosExercicios[index].concluido = !novosExercicios[index].concluido;
        setExercicios(novosExercicios);
    };

    const concluirTreino = () => {
        const todosConcluidos = exercicios.map(ex => ({ ...ex, concluido: true }));
        setExercicios(todosConcluidos);
        setTreinoConcluido(true);

        // Esconde a mensagem após 5 segundos
        setTimeout(() => {
            setTreinoConcluido(false);
        }, 5000);
    };

    const concluidosCount = exercicios.filter(ex => ex.concluido).length;

    useEffect(() => {
        localStorage.setItem('treinoAtual', JSON.stringify(exercicios));
    }, [exercicios]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
            {/* Cabeçalho fixo */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-xl font-semibold">Treino de Pernas - Dia 3</h2>
                    <p className="text-sm text-gray-600">
                        Foco: Quadríceps e Posterior de Coxa
                    </p>
                </div>
                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    <ClockIcon className="w-3 h-3" />
                    Em Andamento
                </span>
            </div>

            {/* Mensagem de conclusão */}
            {treinoConcluido && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
                    <div className="flex items-center justify-center gap-2">
                        <CheckIcon className="w-5 h-5 text-green-600" />
                        <p className="text-green-800 font-medium">Parabéns! Você finalizou seu treino!</p>
                    </div>
                </div>
            )}

            {/* Descrição e estatísticas fixas */}
            <div className="mb-4">
                <p className="text-sm text-gray-700 mb-3">
                    Treino focado no desenvolvimento muscular dos membros inferiores, com ênfase na
                    execução correta dos movimentos.
                </p>

                <div className="grid grid-cols-3 gap-4 text-center mb-4">
                    <div className="bg-gray-50 p-2 rounded">
                        <p className="font-bold text-gray-900">{exercicios.length}</p>
                        <p className="text-xs text-gray-500">Exercícios</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                        <p className="font-bold text-gray-900">45 min</p>
                        <p className="text-xs text-gray-500">Tempo Est.</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                        <p className="font-bold text-gray-900">{concluidosCount}/{exercicios.length}</p>
                        <p className="text-xs text-gray-500">Concluídos</p>
                    </div>
                </div>
            </div>

            {/* Lista de exercícios com scroll */}
            <div className="flex-1 overflow-y-auto max-h-[200px] pr-2 mb-4">
                <div className="space-y-3">
                    {exercicios.map((ex, index) => (
                        <div
                            key={index}
                            className={`flex items-center justify-between p-2 rounded transition-colors cursor-pointer ${ex.concluido
                                ? 'bg-green-50 hover:bg-green-100'
                                : 'hover:bg-gray-50'
                                }`}
                            onClick={() => toggleConcluido(index)}
                        >
                            <div className="min-w-0">
                                <p className={`font-medium truncate ${ex.concluido ? 'text-green-800' : 'text-gray-800'
                                    }`}>
                                    {ex.nome}
                                </p>
                                <p className={`text-xs truncate ${ex.concluido ? 'text-green-600' : 'text-gray-500'
                                    }`}>
                                    {ex.series}
                                </p>
                            </div>
                            {ex.concluido ? (
                                <div className="flex items-center">
                                    <span className="text-xs text-green-600 mr-2">Feito</span>
                                    <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                                </div>
                            ) : (
                                <div className="w-5 h-5 rounded-full border border-gray-300 flex-shrink-0"></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Botão fixo */}
            <button
                className={`w-full text-white py-2.5 rounded-lg transition-colors ${concluidosCount === exercicios.length
                    ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                    }`}
                onClick={concluirTreino}
                disabled={concluidosCount === exercicios.length}
            >
                {concluidosCount === exercicios.length ? 'Treino Concluído' : 'Concluir Treino'}
            </button>
        </div>
    );
}
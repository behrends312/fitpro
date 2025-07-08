import React from "react";

export default function TreinoAtual() {
    return (
        <div className="bg-blue-50  h-full  p-6 rounded-lg shadow-md relative">
            <span className="absolute top-3 right-3 text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded">Em Andamento</span>

            <h2 className="text-lg font-semibold mb-1">Treino de Pernas - Dia 3</h2>
            <p className="text-sm text-gray-700 mb-4">
                Treino focado em membros inferiores com ênfase em quadríceps e posterior de coxa.
            </p>

            <div className="grid grid-cols-3 gap-2 text-center text-sm mb-4">
                <div>
                    <p className="font-semibold">6</p>
                    <p className="text-gray-600">Exercícios</p>
                </div>
                <div>
                    <p className="font-semibold">45 min</p>
                    <p className="text-gray-600">Tempo Est.</p>
                </div>
                <div>
                    <p className="font-semibold">3/6</p>
                    <p className="text-gray-600">Concluído</p>
                </div>
            </div>

            <div className="pt-12">
                <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                    Continuar Treino
                </button>
            </div>

        </div>
    );
}

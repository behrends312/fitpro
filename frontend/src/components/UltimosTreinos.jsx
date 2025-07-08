import React from "react";

export default function UltimosTreinos() {
    const treinos = [
        { nome: "Treino ABC - Completo", diasAtras: 2, progresso: "100%" },
        { nome: "Treino de Costas", diasAtras: 4, progresso: "95%" }
    ];

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-4">
            <h2 className="text-lg font-semibold mb-4">Últimos Treinos</h2>
            {treinos.map((treino, idx) => (
                <div key={idx} className="flex justify-between items-center mb-2">
                    <div>
                        <p className="text-sm font-medium">{treino.nome}</p>
                        <p className="text-xs text-gray-500">{treino.diasAtras} dias atrás</p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{treino.progresso}</span>
                </div>
            ))}
        </div>
    );
}

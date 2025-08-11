import React from "react";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

export default function UltimosTreinos() {
    const treinos = [
        { 
            nome: "Treino ABC - Completo", 
            data: "2 dias atrás", 
            progresso: 100,
            tipo: "Full Body"
        },
        { 
            nome: "Treino de Costas", 
            data: "4 dias atrás", 
            progresso: 95,
            tipo: "Superior"
        },
        { 
            nome: "Treino de Mobilidade", 
            data: "1 semana atrás", 
            progresso: 85,
            tipo: "Alongamento"
        }
    ];

    return (
        <div className="bg-white p-6 rounded-lg shadow-md h-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Histórico de Treinos</h2>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                    Ver todos <ChevronRightIcon className="w-4 h-4 ml-1" />
                </button>
            </div>
            
            <div className="space-y-3">
                {treinos.map((treino, idx) => (
                    <div key={idx} className="group p-3 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-medium">{treino.nome}</p>
                                <p className="text-xs text-gray-500">{treino.tipo} • {treino.data}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                                treino.progresso >= 90 ? 'bg-green-100 text-green-800' :
                                treino.progresso >= 70 ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                            }`}>
                                {treino.progresso}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                            <div 
                                className={`h-1.5 rounded-full ${
                                    treino.progresso >= 90 ? 'bg-green-500' :
                                    treino.progresso >= 70 ? 'bg-blue-500' :
                                    'bg-yellow-500'
                                }`}
                                style={{ width: `${treino.progresso}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
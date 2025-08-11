import React from "react";
import AlunoInfo from "../components/AlunoInfo";
import TreinoAtual from "../components/TreinoAtual";
import UltimosTreinos from "../components/UltimosTreinos";
import ProgressoExercicio from "../components/ProgressoExercicio";

export default function Alunos() {
    return (
        <div className="flex-1 bg-gray-50 p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Visualização do Aluno</h1>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Ver histórico completo
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-1 ">
                    <AlunoInfo />
                </div>
                <div className="lg:col-span-2">
                    <TreinoAtual />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ProgressoExercicio />
                <UltimosTreinos />
            </div>
        </div>
    );
}
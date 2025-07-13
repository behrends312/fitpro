import React from "react";
import AlunoInfo from "../components/AlunoInfo";
import TreinoAtual from "../components/TreinoAtual";
import UltimosTreinos from "../components/UltimosTreinos";
import ProgressoExercicio from "../components/ProgressoExercicio";

export default function Alunos() {
    return (
        <div className="flex-1 bg-gray-100">
            <h1 className="text-2xl font-semibold mb-4">Visualização do Aluno (Exemplo)</h1>

            {/* Informações principais */}
            <div className="flex flex-col md:flex-row gap-6 mb-6 md:items-stretch">
                <div className="w-full md:w-1/3">
                    <AlunoInfo />
                </div>
                <div className="flex-1 ">
                    <TreinoAtual />
                </div>
            </div>

            <ProgressoExercicio />

            {/* Últimos treinos */}
            <UltimosTreinos />

            {/* Exercício e progresso */}

        </div>
    );
}

import React from "react";

export default function AlunoInfo() {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <img
                src="https://i.pravatar.cc/100"
                alt="Foto do Aluno"
                className="w-20 h-20 mx-auto rounded-full mb-4"
            />
            <h2 className="text-lg font-semibold">João Carlos</h2>
            <p className="text-sm text-gray-600">Personal: Ana Silva</p>

            <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-1">Progresso do Mês</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: "75%" }}></div>
                </div>
                <p className="text-sm text-gray-600">Treinos <strong>12/16</strong> &nbsp;|&nbsp; Dias Rest. <strong>8</strong></p>
            </div>

        </div>
    );
}

import React from "react";

export default function AlunoInfo() {
    return (
        <div className="bg-white h-[500px] p-6 rounded-lg shadow-md">
            <div className="flex flex-col items-center">
                <img
                    src="https://i.pravatar.cc/150?img=5"
                    alt="Foto do Aluno"
                    className="w-24 h-24 rounded-full mb-4 border-4 border-blue-100"
                />
                <h2 className="text-xl font-semibold">João Carlos</h2>
                <p className="text-sm text-gray-600 mb-2">Personal: Ana Silva</p>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full mb-4">
                    Plano Ativo
                </span>
            </div>

            <div className="mt-4 space-y-3">
                <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Progresso Mensal</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full"
                            style={{ width: "75%" }}
                        ></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-600">
                        <span>12/16 treinos</span>
                        <span>8 dias restantes</span>
                    </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-1">Objetivo Principal</p>
                    <p className="text-sm text-gray-600">Hipertrofia - Ganho de massa muscular</p>
                </div>
            </div>
        </div>
    );
}
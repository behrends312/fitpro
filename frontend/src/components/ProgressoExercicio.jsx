import React from "react";
import { CircularProgressbarWithChildren, buildStyles } from "react-circular-progressbar";

export default function ProgressoExercicio() {
    const percentage = 75;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4 text-center">Progresso Geral</h2>
            <div className="flex flex-col items-center">
                <div className="w-40 h-40">
                    <CircularProgressbarWithChildren
                        value={percentage}
                        styles={buildStyles({
                            pathColor: `rgba(59, 130, 246, ${percentage / 100})`,
                            trailColor: '#E5E7EB',
                            pathTransitionDuration: 0.5,
                        })}
                    >
                        <div className="text-center">
                            <p className="text-3xl font-bold text-gray-900">{percentage}%</p>
                            <p className="text-sm text-gray-500">de conclusão</p>
                        </div>
                    </CircularProgressbarWithChildren>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-4 w-full">
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <p className="text-2xl font-bold text-blue-600">12</p>
                        <p className="text-xs text-gray-600">Exercícios feitos</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <p className="text-2xl font-bold text-blue-600">4.8</p>
                        <p className="text-xs text-gray-600">Média de avaliação</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
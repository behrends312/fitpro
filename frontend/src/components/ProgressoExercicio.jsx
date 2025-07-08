import React from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import 'react-circular-progressbar/dist/styles.css';

export default function ProgressoExercicio() {
    const percentage = 75;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
            <h2 className="text-lg font-semibold mb-4">Progresso do Exercício</h2>
            <div className="w-32 h-32">
                <CircularProgressbar
                    value={percentage}
                    text={`${percentage}%`}
                    styles={buildStyles({
                        pathColor: `#3B82F6`,
                        textColor: '#111827',
                        trailColor: '#E5E7EB',
                    })}
                />
            </div>
        </div>
    );
}

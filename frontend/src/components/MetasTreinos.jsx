import React, { useState } from 'react';

export default function MetasTreinos() {
    const [metas, setMetas] = useState([
        { id: 1, exercicio: 'Supino', meta: 80, atual: 60, concluida: false },
        { id: 2, exercicio: 'Agachamento', meta: 120, atual: 90, concluida: false }
    ]);

    const progresso = (atual, meta) => Math.min(100, (atual / meta) * 100);

    return (
        <div className="space-y-4">
            {metas.map(meta => (
                <div key={meta.id}>
                    <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{meta.exercicio}</span>
                        <span className="text-xs text-gray-500">{meta.atual}kg / {meta.meta}kg</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className={`h-2.5 rounded-full ${meta.concluida ? 'bg-green-500' : 'bg-blue-600'}`}
                            style={{ width: `${progresso(meta.atual, meta.meta)}%` }}
                        ></div>
                    </div>
                </div>
            ))}

            <button className="mt-4 text-sm text-blue-600 hover:text-blue-800">
                + Adicionar nova meta
            </button>
        </div>
    );
}
import React from "react";

export default function VideoExercicio() {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-2">Exercício: Agachamento Livre</h2>
            <div className="aspect-w-16 aspect-h-9">
                <iframe
                    className="w-full h-64 rounded"
                    src="https://www.youtube.com/embed/SW_C1A-rejs"
                    title="Agachamento Livre"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
            </div>
        </div>
    );
}

import React from "react";

export default function ListaExercicios() {
    const videos = [
        {
            titulo: "Agachamento Livre",
            url: "https://www.youtube.com/embed/SW_C1A-rejs",
        },
        {
            titulo: "Supino Reto",
            url: "https://www.youtube.com/embed/V9RkXL1VZyU",
        },
        {
            titulo: "Levantamento Terra",
            url: "https://www.youtube.com/embed/ytGaGIn3SjE",
        },
        {
            titulo: "Desenvolvimento com Halteres",
            url: "https://www.youtube.com/embed/B-aVuyhvLHU",
        },
        {
            titulo: "Desenvolvimento com Halteres",
            url: "https://www.youtube.com/embed/B-aVuyhvLHU",
        },
        {
            titulo: "Desenvolvimento com Halteres",
            url: "https://www.youtube.com/embed/B-aVuyhvLHU",
        },
        {
            titulo: "Desenvolvimento com Halteres",
            url: "https://www.youtube.com/embed/B-aVuyhvLHU",
        },
        {
            titulo: "Desenvolvimento com Halteres",
            url: "https://www.youtube.com/embed/B-aVuyhvLHU",
        },
        {
            titulo: "Desenvolvimento com Halteres",
            url: "https://www.youtube.com/embed/B-aVuyhvLHU",
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
            {videos.map((video, index) => (
                <div
                    key={index}
                    className="flex flex-col h-72 bg-white rounded shadow p-3"
                >
                    <h2 className="text-sm font-semibold mb-2">{video.titulo}</h2>
                    <div className="flex-1">
                        <iframe
                            className="w-full h-full rounded"
                            src={video.url}
                            title={video.titulo}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            ))}
        </div>
    );
}
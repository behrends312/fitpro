import React from "react";

const activities = [
    {
        name: "Ana Silva",
        text: "adicionou um novo treino",
        time: "2 horas atrás",
        detail: "Treino de pernas para João Carlos",
        avatar: "https://randomuser.me/api/portraits/women/1.jpg",
    },
    {
        name: "Carlos Eduardo",
        text: "completou um treino",
        time: "5 horas atrás",
        detail: "Treino ABC - 85% concluído",
        avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    },
    {
        name: "Mariana Oliveira",
        text: "enviou uma mensagem",
        time: "Ontem, 18:30",
        detail: "“Preciso ajustar meu treino de ombros”",
        avatar: "https://randomuser.me/api/portraits/women/2.jpg",
    },
];

export default function RecentActivity() {
    return (
        <div className="bg-white p-4 rounded-lg shadow col-span-2">
            <div className="flex justify-between mb-4">
                <h2 className="font-semibold text-lg">Atividade Recente</h2>
                <a href="#" className="text-blue-500 text-sm">Ver tudo</a>
            </div>
            <ul>
                {activities.map((a, i) => (
                    <li key={i} className="flex mb-4">
                        <img src={a.avatar} alt="avatar" className="w-10 h-10 rounded-full mr-3" />
                        <div>
                            <p><strong>{a.name}</strong> {a.text}</p>
                            <p className="text-sm text-gray-500">{a.detail}</p>
                            <p className="text-xs text-gray-400">{a.time}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

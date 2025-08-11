import React from "react";
import * as Avatar from "@radix-ui/react-avatar";

const activities = [
    {
        id: 1,
        name: "Ana Silva",
        text: "adicionou um novo treino",
        time: "2 horas atrás",
        detail: "Treino de pernas para João Carlos",
        avatar: "https://randomuser.me/api/portraits/women/1.jpg",
    },
    {
        id: 2,
        name: "Carlos Eduardo",
        text: "completou um treino",
        time: "5 horas atrás",
        detail: "Treino ABC - 85% concluído",
        avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    },
    {
        id: 3,
        name: "Mariana Oliveira",
        text: "enviou uma mensagem",
        time: "Ontem, 18:30",
        detail: "“Preciso ajustar meu treino de ombros”",
        avatar: "https://randomuser.me/api/portraits/women/2.jpg",
    },
    {
        id: 4,
        name: "João Pedro",
        text: "completou um treino",
        time: "Ontem, 15:45",
        detail: "Treino de mobilidade - 100% concluído",
        avatar: "https://randomuser.me/api/portraits/men/2.jpg",
    },
    {
        id: 5,
        name: "Fernanda Costa",
        text: "adicionou um novo exercício",
        time: "Ontem, 12:20",
        detail: "Agachamento sumô para turma de iniciantes",
        avatar: "https://randomuser.me/api/portraits/women/3.jpg",
    },
    {
        id: 6,
        name: "Ricardo Almeida",
        text: "enviou uma mensagem",
        time: "Ontem, 10:10",
        detail: "“Podemos marcar uma avaliação física?”",
        avatar: "https://randomuser.me/api/portraits/men/3.jpg",
    }
];

export default function RecentActivity() {
    return (
        <div className="bg-white p-6 rounded-lg shadow col-span-2 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="font-semibold text-xl">Atividade Recente</h2>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Ver tudo
                </button>
            </div>

            {/* Lista de atividades com scroll */}
            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-650px)] pr-2">
                <ul className="space-y-4">
                    {activities.map((activity) => (
                        <li key={activity.id} className="flex gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                            <Avatar.Root className="inline-flex h-10 w-10 select-none items-center justify-center overflow-hidden rounded-full align-middle flex-shrink-0">
                                <Avatar.Image
                                    className="h-full w-full rounded-[inherit] object-cover"
                                    src={activity.avatar}
                                    alt={activity.name}
                                />
                                <Avatar.Fallback
                                    className="text-violet11 leading-1 flex h-full w-full items-center justify-center bg-white text-[15px] font-medium"
                                    delayMs={600}
                                >
                                    {activity.name.charAt(0)}
                                </Avatar.Fallback>
                            </Avatar.Root>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <strong className="text-sm font-medium truncate">{activity.name}</strong>
                                    <span className="text-gray-500 text-sm truncate">{activity.text}</span>
                                    <span className="text-gray-400 text-xs ml-auto whitespace-nowrap">
                                        {activity.time}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1 truncate">{activity.detail}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
import React from "react";
import CardMetric from "../components/CardMetric";
import RecentActivity from "../components/RecentActivity";
import CadastrarPersonalForm from "../components/CadastrarPersonalForm";

export default function Home() {
    return (
        <div className="flex-1 bg-gray-50 p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white border rounded-lg text-sm font-medium hover:bg-gray-50">
                        Exportar
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                        Criar Novo
                    </button>
                </div>
            </div>

            {/* Cards de Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <CardMetric
                    title="Total Alunos"
                    value="248"
                    badge="+12%"
                    icon="👥"
                    color="blue"
                />
                <CardMetric
                    title="Personais"
                    value="15"
                    badge="+2"
                    icon="🧑‍🏫"
                    color="purple"
                />
                <CardMetric
                    title="Treinos Ativos"
                    value="187"
                    badge="+24%"
                    icon="💪"
                    color="green"
                />
                <CardMetric
                    title="Exercícios"
                    value="356"
                    badge="+45"
                    icon="🏃‍♂️"
                    color="yellow"
                />
            </div>

            {/* Conteúdo Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <RecentActivity />
                </div>
                <div>
                    <CadastrarPersonalForm />
                </div>
            </div>
        </div>
    );
}
import React from "react";
import Sidebar from "../components/Sidebar";
import CardMetric from "../components/CardMetric";
import RecentActivity from "../components/RecentActivity";
import CadastrarPersonalForm from "../components/CadastrarPersonalForm";

export default function Home() {
    return (
        <div className="flex h-screen">
            <Sidebar />

            <div className="flex-1 p-6 overflow-y-auto bg-gray-100">
                <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>

                {/* Cards de Métricas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <CardMetric title="Total Alunos" value="248" badge="+12%" icon="👥" color="blue" />
                    <CardMetric title="Personais" value="15" badge="+2" icon="🧑‍🏫" color="purple" />
                    <CardMetric title="Treinos Ativos" value="187" badge="+24%" icon="💪" color="green" />
                    <CardMetric title="Exercícios" value="356" badge="+45" icon="🏃‍♂️" color="yellow" />
                </div>

                {/* Conteúdo Principal */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <RecentActivity />
                    <CadastrarPersonalForm />
                </div>
            </div>
        </div>
    );
}

// Componentes


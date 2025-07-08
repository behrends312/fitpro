import React from "react";

export default function Sidebar() {
    return (
        <aside className="w-64 bg-[#0B1120] text-white flex flex-col">
            <div className="px-6 py-4 font-bold text-xl border-b border-gray-700">
                FitPro
            </div>
            <nav className="flex-1 p-4 space-y-2">
                <SidebarItem text="Dashboard" />
                <SidebarItem text="Alunos" />
                <SidebarItem text="Personais" />
                <SidebarItem text="Exercícios" />
                <SidebarItem text="Vídeos" />
                <div className="border-t border-gray-700 my-2" />
                <SidebarItem text="Configurações" />
                <SidebarItem text="Sair" />
            </nav>
        </aside>
    );
}

function SidebarItem({ text }) {
    return (
        <div className="hover:bg-gray-800 p-2 rounded cursor-pointer">
            {text}
        </div>
    );
}

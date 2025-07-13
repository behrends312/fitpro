import React from "react";
import { Link } from "react-router-dom";

export default function Sidebar() {
    return (
        <>
            <aside className="w-36 bg-[#0B1120] text-white flex flex-col min-h-screen pt-10 fixed overflow-y-auto ">
                <nav className="flex-1 p-2 space-y-2">
                    <SidebarItem text="Dashboard" to="/" />
                    <SidebarItem text="Alunos" to="/alunos" />
                    <SidebarItem text="Personais" />
                    <SidebarItem text="Exercícios" to="/exercicios" />
                    <SidebarItem text="Vídeos" />
                    <div className="border-t border-gray-700 my-2" />
                    <SidebarItem text="Configurações" />
                    <SidebarItem text="Sair" />
                </nav>
            </aside>

        </>
    );
}

function SidebarItem({ text, to }) {
    if (to) {
        return (
            <Link to={to} className="block hover:bg-gray-800 p-2 rounded">
                {text}
            </Link>
        );
    }

    return (
        <div className="hover:bg-gray-800 p-2 rounded cursor-pointer">
            {text}
        </div>
    );
}

import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsersLine, faDumbbell, faVideo, faClipboard, faChartLine } from '@fortawesome/free-solid-svg-icons';

export default function Sidebar() {
    return (
        <>
            <aside className="w-36 bg-[#0B1120] text-white flex flex-col min-h-screen pt-10 fixed overflow-y-auto ">
                <nav className="flex-1 p-2 space-y-2">
                    <SidebarItem icon={faChartLine} text="Dashboard" to="/" />
                    <SidebarItem icon={faUsersLine} text="Alunos" to="/alunos" />
                    <SidebarItem icon={faClipboard} text="Personais" to="/" />
                    <SidebarItem icon={faDumbbell} text="Exercícios" to="/exercicios" />
                    <SidebarItem icon={faVideo} text="Vídeos" to="/" />
                    <div className="border-t border-gray-700 my-2" />
                    <SidebarItem text="Configurações" />
                    <SidebarItem text="Sair" />
                </nav>
            </aside>

        </>
    );
}

function SidebarItem({ text, to, icon }) {
    if (to) {
        return (
            <Link to={to} className="block hover:bg-gray-800 p-2 rounded">
                {icon && <FontAwesomeIcon icon={icon} className="text-white pr-2" />}
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

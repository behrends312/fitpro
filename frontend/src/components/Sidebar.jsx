import React from "react";
import { Link, useNavigate  } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsersLine, faDumbbell, faVideo, faClipboard, faChartLine } from '@fortawesome/free-solid-svg-icons';
import api from "../services/api";

export default function Sidebar() {

    const navigate = useNavigate();

  const handleLogout = () => {
    // Remove o token salvo
    localStorage.removeItem("token");

    // Remove o header Authorization (opcional mas recomendado)
    delete api.defaults.headers.common.Authorization;

    // Redireciona para login
    navigate("/login");
  };

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
                    <div
                        onClick={handleLogout}
                        className="hover:bg-gray-800 p-2 rounded cursor-pointer text-red-400 font-semibold"
                        >
                        Sair
                    </div>
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

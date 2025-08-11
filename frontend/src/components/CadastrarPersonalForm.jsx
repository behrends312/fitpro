import React from "react";
import { PlusIcon } from "@radix-ui/react-icons";
import CustomDialog from "./ui/Dialog";

export default function CadastrarPersonalForm() {
    // Dados de exemplo - substitua por seus dados reais
    const personais = [
        { id: 1, nome: "Ana Silva", especialidade: "Hipertrofia", iniciais: "AS" },
        { id: 2, nome: "Carlos Eduardo", especialidade: "Cardio", iniciais: "CE" },
        { id: 3, nome: "Mariana Oliveira", especialidade: "Esportes específicos", iniciais: "MO" },
        { id: 4, nome: "João Pedro", especialidade: "Pernas", iniciais: "JP" },
        { id: 5, nome: "Fernanda Costa", especialidade: "Hipertrofia", iniciais: "FC" },
        { id: 6, nome: "Ricardo Almeida", especialidade: "Cardio", iniciais: "RA" },
    ];

    return (
        <div className="bg-white p-6 rounded-lg shadow h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="font-semibold text-xl">Personais</h2>

                <CustomDialog
                    trigger={
                        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                            <PlusIcon className="w-4 h-4" />
                            Adicionar Personal
                        </button>
                    }
                    title="Cadastrar Novo Personal"
                >
                    <form className="mt-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nome Completo
                            </label>
                            <input
                                type="text"
                                placeholder="Nome Completo"
                                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                E-mail
                            </label>
                            <input
                                type="email"
                                placeholder="E-mail"
                                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Telefone
                            </label>
                            <input
                                type="tel"
                                placeholder="Telefone"
                                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Especialidade
                            </label>
                            <select className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option>Selecione</option>
                                <option>Pernas</option>
                                <option>Cardio</option>
                                <option>Hipertrofia</option>
                                <option>Esportes específicos</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-colors"
                        >
                            Cadastrar Personal
                        </button>
                    </form>
                </CustomDialog>
            </div>

            {/* Lista de personais com scroll */}
            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-650px)] pr-2">
                <div className="space-y-3">
                    {personais.map((personal) => (
                        <div
                            key={personal.id}
                            className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                                <span>{personal.iniciais}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium truncate">{personal.nome}</h3>
                                <p className="text-sm text-gray-500 truncate">{personal.especialidade}</p>
                            </div>
                            <button className="text-gray-400 hover:text-gray-600 ml-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
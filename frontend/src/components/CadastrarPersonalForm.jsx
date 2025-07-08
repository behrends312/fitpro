import React from "react";

export default function CadastrarPersonalForm() {
    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-semibold text-lg mb-4">Cadastrar Personal</h2>
            <form className="space-y-3">
                <input type="text" placeholder="Nome Completo" className="w-full border px-3 py-2 rounded" />
                <input type="email" placeholder="E-mail" className="w-full border px-3 py-2 rounded" />
                <input type="tel" placeholder="Telefone" className="w-full border px-3 py-2 rounded" />
                <select className="w-full border px-3 py-2 rounded">
                    <option>Selecione</option>
                    <option>Pernas</option>
                    <option>Cardio</option>
                    <option>Hipertrofia</option>
                </select>
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                    Cadastrar Personal
                </button>
            </form>
        </div>
    );
}

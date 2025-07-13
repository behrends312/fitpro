import React from "react";
import ListaExercicios from "../components/ListaExercicios";

export default function Exercicios() {
    return (

        <div className="flex h-screen">
            <div className="grid flex-1 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                <ListaExercicios />

            </div>
        </div>
    )

}
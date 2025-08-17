// components/GraficoEvolucao.jsx
import React from 'react';
import { Line } from 'react-chartjs-2'; // Mudei de Bar para Line
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement, // Adicionei
    LineElement,  // Adicionei
    Title,
    Tooltip,
    Legend,
    Filler       // Adicionei para preenchimento
} from 'chart.js';

// Registra os componentes necessários para gráfico de linha
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement, // Registre os novos elementos
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const GraficoEvolucao = () => {
    const data = {
        labels: ["30/set", "07/out", "14/out", "21/out", "28/out"], // Adicionei mais datas
        datasets: [
            {
                label: 'Supino (kg)',
                data: [60, 72, 68, 75, 80], // Adicionei mais dados
                borderColor: '#3b82f6',      // Cor da linha
                backgroundColor: 'rgba(59, 130, 246, 0.1)', // Fundo gradiente
                tension: 0.4,                // Suaviza a curva
                fill: true,                  // Ativa preenchimento
                pointBackgroundColor: '#3b82f6',
                pointRadius: 5,
                pointHoverRadius: 8
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false, // Permite ocupar toda a largura
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    boxWidth: 12,
                    padding: 20
                }
            },
            title: {
                display: true,
                text: 'Progresso do Supino',
                font: {
                    size: 16
                },
                padding: {
                    bottom: 20
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false
            }
        },
        scales: {
            y: {
                beginAtZero: false,
                min: 50,                   // Valor mínimo do eixo Y
                max: 90,                   // Valor máximo do eixo Y
                ticks: {
                    stepSize: 10
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                },
                title: {
                    display: true,
                    text: 'Carga (kg)',
                    font: {
                        weight: 'bold'
                    }
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        },
        interaction: {
            intersect: false,
            mode: 'index'
        }
    };

    return (
        <div className="w-full h-[400px] bg-white p-6 rounded-xl shadow-lg">
            <Line
                data={data}
                options={options}
            />
        </div>
    );
};

export default GraficoEvolucao;
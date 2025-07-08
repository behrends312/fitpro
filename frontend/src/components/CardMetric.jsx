import React from "react";

export default function CardMetric({ title, value, badge, icon, color }) {
    const bg = {
        blue: "bg-blue-100 text-blue-800",
        purple: "bg-purple-100 text-purple-800",
        green: "bg-green-100 text-green-800",
        yellow: "bg-yellow-100 text-yellow-800",
    }[color] || "bg-gray-100 text-gray-800";

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl mb-2 ${bg}`}>
                {icon}
            </div>
            <div className="text-xl font-semibold">{value}</div>
            <div className="text-gray-600">{title}</div>
            <div className="text-green-500 text-sm mt-1">{badge} este mês</div>
        </div>
    );
}

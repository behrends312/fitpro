import React from "react";
import { ArrowUpIcon } from "@radix-ui/react-icons";

export default function CardMetric({ title, value, badge, icon, color }) {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-600",
        purple: "bg-purple-50 text-purple-600",
        green: "bg-green-50 text-green-600",
        yellow: "bg-yellow-50 text-yellow-600",
    };

    return (
        <div className={`p-4 rounded-lg ${colorClasses[color]}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-2xl font-bold mt-1">{value}</p>
                </div>
                <span className="text-2xl">{icon}</span>
            </div>
            {badge && (
                <div className="flex items-center mt-2 text-xs">
                    <ArrowUpIcon className="w-3 h-3 mr-1" />
                    <span>{badge}</span>
                </div>
            )}
        </div>
    );
}
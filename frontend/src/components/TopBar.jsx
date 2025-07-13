import React from "react";
import { Link } from "react-router-dom";

export default function TopBar() {
    return (
        <div className="w-full fixed text-white bg-[#0B1120] px-2 py-2 pl-4 font-bold text-xl z-10">
            <Link to="/" className="hover:opacity-80 transition-opacity">
                FitPro
            </Link>
        </div>
    );
}
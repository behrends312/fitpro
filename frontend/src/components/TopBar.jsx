import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDumbbell } from '@fortawesome/free-solid-svg-icons';

export default function TopBar() {
    return (
        <div className="w-full fixed text-white bg-[#0B1120] px-2 py-2 pl-4 font-bold text-xl z-10">
            <Link to="/" className="hover:opacity-80 transition-opacity">
                <FontAwesomeIcon icon={faDumbbell} style={{ color: "#74C0FC", paddingRight: "4px" }} />
                FitPro
            </Link>
        </div>
    );
}
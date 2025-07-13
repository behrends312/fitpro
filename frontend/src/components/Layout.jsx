import React from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { Outlet } from "react-router-dom";

export default function Layout() {
    return (
        <div className="flex flex-col">
            <TopBar />
            <div className="flex flex-1">
                <Sidebar />
                <main className="flex-1 ml-36 pl-6 pr-6 pt-14 pb-6 bg-gray-100">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

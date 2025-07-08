import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Alunos from "./pages/Alunos"; // Crie essa página se ainda não existir

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/alunos" element={<Alunos />} />
      </Routes>
    </Router>
  );
}

export default App;

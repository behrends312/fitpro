import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Alunos from "./pages/Alunos"; // Crie essa página se ainda não existir
import Exercicios from "./pages/Exercicios";
import Layout from "./components/Layout";

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>

          <Route path="/" element={<Home />} />
          <Route path="/alunos" element={<Alunos />} />
          <Route path="/exercicios" element={<Exercicios />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

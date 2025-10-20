import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Alunos from "./pages/Alunos"; // Crie essa página se ainda não existir
import Exercicios from "./pages/Exercicios";
import Layout from "./components/Layout";
import ProgressoTreinos from "./pages/ProgressoTreinos";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RequireAuth from "./components/RequireAuth";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> 

        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route path="/" element={<Home />} />
          <Route path="/alunos" element={<Alunos />} />
          <Route path="/aluno/progresso" element={<ProgressoTreinos />} />
          <Route path="/exercicios" element={<Exercicios />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

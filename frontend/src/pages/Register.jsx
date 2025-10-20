import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../logo.svg";
import { registerUser } from "../services/authService";
import api from "../services/api";

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("aluno");

  const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { token, user } = await registerUser({ email, password, role });
            // guarda o token e configura axios
            localStorage.setItem("token", token);
            api.defaults.headers.common.Authorization = `Bearer ${token}`;
            // redireciona pro dashboard
            alert(`Bem-vindo, ${user.email}!`);
            navigate("/");
        } catch (error) {
            console.error(error);
            const msg = error?.response?.data?.error || "Erro ao registrar.";
            alert(msg);
        }
    };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Lado esquerdo */}
      <div className="hidden md:flex w-1/2 bg-blue-600 text-white flex-col justify-center items-center">
        <h1 className="text-4xl font-bold mb-4">FitPro</h1>
        <p className="text-lg text-center px-12">
          Cadastre-se e comece a gerenciar seus treinos com facilidade.
        </p>
      </div>

      {/* Formulário */}
      <div className="flex w-full md:w-1/2 items-center justify-center bg-white">
        <div className="w-full max-w-md p-8">
          <div className="flex flex-col items-center mb-8">
            <img src={logo} alt="FitPro" className="h-12 mb-2" />
            <h2 className="text-2xl font-semibold text-gray-800">
              Criar nova conta
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="seuemail@exemplo.com"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Senha
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Tipo de usuário
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="aluno">Aluno</option>
                <option value="personal">Personal</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Registrar
            </button>

            <div className="text-center mt-4">
              <p className="text-gray-600">
                Já tem uma conta?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-blue-600 hover:underline"
                >
                  Fazer login
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

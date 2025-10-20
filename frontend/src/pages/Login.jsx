import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../logo.svg";
import { loginUser } from "../services/authService";
import api from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { token, user } = await loginUser({ email, password });

      // guarda o token e configura o header global
      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);
      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      alert(`Bem-vindo, ${user.email}!`);
      navigate("/"); // redireciona pra home
    } catch (error) {
      console.error("Erro no login:", error);
      const msg = error?.response?.data?.error || "Erro ao fazer login.";
      alert(msg);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Lado esquerdo */}
      <div className="hidden md:flex w-1/2 bg-blue-600 text-white flex-col justify-center items-center">
        <h1 className="text-4xl font-bold mb-4">FitPro</h1>
        <p className="text-lg text-center px-12">
          Gerencie seus treinos, alunos e personais em um só lugar.
        </p>
      </div>

      {/* Formulário */}
      <div className="flex w-full md:w-1/2 items-center justify-center bg-white">
        <div className="w-full max-w-md p-8">
          <div className="flex flex-col items-center mb-8">
            <img src={logo} alt="FitPro" className="h-12 mb-2" />
            <h2 className="text-2xl font-semibold text-gray-800">
              Entrar na sua conta
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

            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Entrar
            </button>

            <div className="text-center mt-4">
              <p className="text-gray-600">
                Não tem uma conta?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="text-blue-600 hover:underline"
                >
                  Registrar
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

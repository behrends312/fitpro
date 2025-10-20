import api from "./api";

export async function registerUser({ email, password, role }) {
  const { data } = await api.post("/auth/register", { email, password, role });
  return data; // { token, user }
}

export async function loginUser({ email, password }) {
  const { data } = await api.post("/auth/login", { email, password });
  return data;
}

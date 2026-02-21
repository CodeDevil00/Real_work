import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:5000",
});

export function authHeader(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } };
}
import axios from "axios";

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL: apiBase,
  timeout: 20000,
});

export function authHeader(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as
      | { message?: string; error?: string; errors?: Array<{ message?: string }> }
      | undefined;

    if (payload?.message) return payload.message;
    if (payload?.error) return payload.error;
    if (payload?.errors?.length && payload.errors[0]?.message) return payload.errors[0].message;
    return error.message || "Request failed";
  }

  if (error instanceof Error) return error.message;
  return "Unexpected error";
}

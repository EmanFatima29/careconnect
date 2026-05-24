// utils/auth.js
import { decodeJwt } from "jose";
export const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const { exp } = decodeJwt(token);
    return exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

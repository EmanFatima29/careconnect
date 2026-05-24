import axios from "axios";

const BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/ratings`;

const authHeader = (session) =>
  session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {};

export const apiSubmitRating = (data, session) =>
  axios.post(BASE, data, { headers: authHeader(session), withCredentials: true });

export const apiGetUserRatings = (userId, params = {}) =>
  axios.get(`${BASE}/${userId}`, { params });

export const apiGetMyRating = (userId, session) =>
  axios.get(`${BASE}/my/${userId}`, { headers: authHeader(session), withCredentials: true });

export const apiDeleteRating = (id, session) =>
  axios.delete(`${BASE}/${id}`, { headers: authHeader(session), withCredentials: true });

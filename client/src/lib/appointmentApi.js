import axios from "axios";
import { getSession } from "next-auth/react";

const base = () => process.env.NEXT_PUBLIC_API_BASE_URL;

async function authHeaders() {
  const session = await getSession();
  return session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {};
}

export const apiBookAppointment = async (payload) => {
  const headers = await authHeaders();
  const { data } = await axios.post(`${base()}/api/appointments`, payload, { headers, withCredentials: true });
  return data;
};

export const apiGetMyAppointments = async (params = {}) => {
  const headers = await authHeaders();
  const { data } = await axios.get(`${base()}/api/appointments`, { headers, params, withCredentials: true });
  return data;
};

export const apiUpdateAppointmentStatus = async (id, payload) => {
  const headers = await authHeaders();
  const { data } = await axios.patch(`${base()}/api/appointments/${id}/status`, payload, { headers, withCredentials: true });
  return data;
};

export const apiGetDoctorAvailability = async (doctorId, date) => {
  const { data } = await axios.get(`${base()}/api/appointments/availability/${doctorId}`, { params: { date } });
  return data;
};

import axios from "axios";

function normalizePrescription(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id || raw._id;
  return {
    id: id ? String(id) : undefined,
    name: raw.name || raw.prescriptionName || "",
    dosage: raw.dosage || "",
    area: raw.area ?? "",
    plantedDate: raw.plantedDate || raw.createdAt || "",
    status: raw.status || "Prescribed",
    notes: raw.notes || "",
  };
}

function isNotFoundError(err) {
  const status = err?.response?.status;
  return status === 404;
}

export async function fetchPrescriptions({ accessToken, baseUrl }) {
  try {
    const res = await axios.get(`${baseUrl}/api/prescriptions`, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });

    const list = Array.isArray(res.data) ? res.data : res.data?.prescriptions;
    if (!Array.isArray(list)) return { ok: true, prescriptions: [] };

    return {
      ok: true,
      prescriptions: list.map(normalizePrescription).filter(Boolean),
    };
  } catch (err) {
    if (isNotFoundError(err)) {
      return { ok: false, notFound: true, prescriptions: [] };
    }
    return { ok: false, error: err, prescriptions: [] };
  }
}

export async function createPrescription({ accessToken, baseUrl, prescription }) {
  const res = await axios.post(`${baseUrl}/api/prescriptions`, prescription, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  const normalized = normalizePrescription(res.data?.prescription || res.data);
  return normalized;
}

export async function updatePrescription({ accessToken, baseUrl, id, updates }) {
  const res = await axios.patch(
    `${baseUrl}/api/prescriptions/${encodeURIComponent(id)}`,
    updates,
    {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    }
  );
  const normalized = normalizePrescription(res.data?.prescription || res.data);
  return normalized;
}

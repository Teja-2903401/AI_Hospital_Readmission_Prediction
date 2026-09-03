
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================================
// HEALTH CHECK
// ============================================================

export const checkBackendHealth = async () => {
  const response = await api.get("/health");

  return response.data;
};


// ============================================================
// CREATE PREDICTION
// ============================================================

export const createPrediction = async (predictionData) => {
  const response = await api.post(
    "/api/predictions/predict",
    predictionData
  );

  return response.data;
};


// ============================================================
// GET PREDICTION HISTORY
// ============================================================

export const getPredictionHistory = async () => {
  const response = await api.get(
    "/api/predictions/"
  );

  return response.data;
};


export default api;


// src/api/backend.js

import axios from "axios";

// ✅ Define BASE_URL first (outside the create)
const BASE_URL = import.meta.env.VITE_API_URL;

const instance = axios.create({
  baseURL: BASE_URL, // ✅ set baseURL correctly
});

export default instance;

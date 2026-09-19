// Flag to toggle between Mock LocalStorage and real Backend REST API
export const USE_MOCK = true;

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Utility helper for simulated network latency in mock mode (makes UI state transitions feel realistic)
export const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

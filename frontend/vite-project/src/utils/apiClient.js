import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://localhost:5000/api',
    withCredentials: true
});

export default apiClient;

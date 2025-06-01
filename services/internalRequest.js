const axios = require('axios');
const https = require('https');
require('dotenv').config();

/**
 * Membuat internal request ke API lain di server yang sama.
 * @param {string} method - HTTP method (GET, POST, dll).
 * @param {string} path - Path endpoint (contoh: '/api/users').
 * @param {object} data - Data payload (untuk POST/PUT).
 * @param {object} headers - Header tambahan (opsional).
 * @returns {Promise<object>} - Response dari API internal.
 */
const internalAxios = axios.create({
  baseURL: `https://localhost:${process.env.PORT}`,
  httpsAgent: new https.Agent({  
    rejectUnauthorized: false // Ignore self-signed cert errors
  })
});

const callInternalAPI = async (method, path, data = {}, headers = {}) => {
    try {
        const response = await internalAxios({
            method,
            url: path,
            data,
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
        });
        return response.data;
    } catch (error) {
        console.error('[Internal Request Error]', error.message);
        if (error.code === 'ECONNRESET') {
            throw new Error('Koneksi internal terputus. Pastikan server HTTPS berjalan dengan benar.');
        }
        throw new Error(`Internal API call failed: ${error.response?.data?.message || error.message}`);
    }
};

module.exports = callInternalAPI;
const axios = require('axios');
const https = require('https');
require('dotenv').config();

const internalAxios = axios.create({
  baseURL: `http://localhost:${process.env.PORT}`,
  httpsAgent: new https.Agent({  
    rejectUnauthorized: false
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
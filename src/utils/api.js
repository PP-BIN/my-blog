// 파일: src/utils/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// ★ FormData 전송 시 Content-Type을 axios가 자동 설정하도록 보장
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // 만약 누군가 전역에서 JSON으로 강제했다면, FormData일 때 제거
  const isFormData = (config.data instanceof FormData);
  if (isFormData) {
    // axios가 boundary 포함하여 자동 설정하도록 Content-Type 제거
    if (config.headers && config.headers['Content-Type']) {
      delete config.headers['Content-Type'];
    }
  }
  return config;
});

export default api;

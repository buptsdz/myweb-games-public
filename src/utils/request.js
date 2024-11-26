import axios from 'axios';

const online_url = 'http://test.sparkflare.cn/sdz_web';
const test_url = '/api';//配合vue.config.js中代理,防止跨域

const baseURL = process.env.NODE_ENV === 'production' ? online_url : online_url;

// 创建axios实例
const axiosRequest = axios.create({
    baseURL,
    timeout: 6000,
    // 如果需要跨域携带认证信息
    withCredentials: true
});

// 请求拦截器
axiosRequest.interceptors.request.use(
    config => {

        // FormData处理
        if (
            ['post', 'put', 'patch'].includes(config.method?.toLowerCase()) &&
            config.data &&
            typeof config.data === 'object' &&
            !(config.data instanceof FormData)
        ) {
            const formData = new FormData();
            Object.entries(config.data).forEach(([key, value]) => {
                if (typeof value === 'object' && value !== null) {
                    formData.append(key, JSON.stringify(value));
                } else if (value === '') {
                    formData.append(key, ' ');
                } else {
                    formData.append(key, value);
                }
            });
            config.data = formData;
        }
        return config;
    },
    error => Promise.reject(error)
);

// 响应拦截器
axiosRequest.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 403) {
            console.error('Access Denied:', {
                url: error.config?.url,
                message: error.response?.data?.message
            });
        }
        return Promise.reject(error);
    }
);

export default axiosRequest;
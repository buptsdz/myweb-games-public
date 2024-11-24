import axios from 'axios';

const online_url = 'http://test.sparkflare.cn/sdz_web'
const test_url = 'http://127.0.0.1:60608'

// 根据环境设置基础URL
const baseURL = process.env.NODE_ENV === 'production' ? online_url : test_url;

// 创建一个 axios 实例
const axiosRequest = axios.create({
    baseURL,
    timeout: 6000,
});

// 将对象转换为FormData的辅助函数
const convertToFormData = (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
        // 如果值是数组或对象，转换为JSON字符串
        if (typeof data[key] === 'object' && data[key] !== null) {
            formData.append(key, JSON.stringify(data[key]));
        } else if (data[key] === '') {
            // 如果值是空字符串，添加一个占位符
            formData.append(key, ' ');
        } else {
            formData.append(key, data[key]);
        }
    });
    return formData;
};

// 请求拦截器
axiosRequest.interceptors.request.use(
    config => {
        // 如果是POST、PUT或PATCH请求，且数据是普通对象，则转换为FormData
        if (
            ['post', 'put', 'patch'].includes(config.method?.toLowerCase()) &&
            config.data &&
            typeof config.data === 'object' &&
            !(config.data instanceof FormData)
        ) {
            config.data = convertToFormData(config.data);
            // 设置合适的Content-Type
            config.headers['Content-Type'] = 'multipart/form-data';
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// 响应拦截器
axiosRequest.interceptors.response.use(
    response => {
        return response;
    },
    error => {
        return Promise.reject(error);
    }
);

export default axiosRequest;
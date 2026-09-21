import axios from 'axios';

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://arka-hub-api-env.eba-wtbeagmw.us-east-1.elasticbeanstalk.com/'; // 'http://localhost:5000';

axios.defaults.baseURL = API_BASE_URL;

export default axios;

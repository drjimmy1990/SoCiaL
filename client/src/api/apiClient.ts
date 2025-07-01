import axios from 'axios';

// Create a pre-configured instance of axios.
const apiClient = axios.create({
  baseURL: 'http://localhost:5001/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Axios Request Interceptor ---
// This function will run before every single request is sent by this apiClient.
apiClient.interceptors.request.use(
  (config) => {
    // Get the token from local storage
    const token = localStorage.getItem('token');
    
    // If the token exists, add the Authorization header to the request
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config; // Return the modified configuration
  },
  (error) => {
    // Handle any errors during request setup
    return Promise.reject(error);
  }
);

export default apiClient;
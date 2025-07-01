import axios, { isAxiosError } from 'axios';
import config from '../config';

// Create a pre-configured instance of axios for the Evolution API.
const evolutionApiClient = axios.create({
  baseURL: config.evolution.apiUrl,
  headers: {
    'apikey': config.evolution.apiKey,
    'Content-Type': 'application/json'
  }
});

/**
 * Creates a new WhatsApp instance using the Evolution API.
 * @param instanceName - A unique name for the instance.
 * @param phoneNumber - The user's WhatsApp number.
 * @returns The data returned from the Evolution API.
 */
export const createEvolutionInstance = async (instanceName: string, phoneNumber: string) => {
  const endpoint = '/instance/create';
  try {
    console.log(`[Evolution API] Attempting to POST ${endpoint}`);
    const response = await evolutionApiClient.post(endpoint, {
      instanceName: instanceName,
      token: "", // Dynamically create the API key for the instance
      number: phoneNumber, // Pass the user's number as per the docs
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS'
    });
    console.log(`[Evolution API] Successfully created instance: ${instanceName}`);
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      console.error(`[Evolution API] Axios error on ${endpoint}:`, error.response?.data || error.message);
    } else {
      console.error(`[Evolution API] An unexpected error occurred on ${endpoint}:`, error);
    }
    throw error;
  }
};

/**
 * Deletes a WhatsApp instance from the Evolution API.
 * @param instanceName - The name of the instance to delete.
 */
export const deleteEvolutionInstance = async (instanceName: string) => {
  const endpoint = `/instance/delete/${instanceName}`;
  try {
    console.log(`[Evolution API] Attempting to DELETE ${endpoint}`);
    const response = await evolutionApiClient.delete(endpoint);
    console.log(`[Evolution API] Successfully deleted instance: ${instanceName}`);
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      console.error(`[Evolution API] Axios error on ${endpoint}:`, error.response?.data || error.message);
    } else {
      console.error(`[Evolution API] An unexpected error occurred on ${endpoint}:`, error);
    }
    throw error;
  }
};

/**
 * Gets the connection state of a WhatsApp instance.
 * @param instanceName - The name of the instance to check.
 * @returns The connection state data (e.g., { state: 'open' }).
 */
export const getInstanceConnectionState = async (instanceName: string) => {
  const endpoint = `/instance/connectionState/${instanceName}`;
  try {
    console.log(`[Evolution API] Attempting to GET ${endpoint}`);
    const response = await evolutionApiClient.get(endpoint);
    console.log(`[Evolution API] Successfully fetched state for instance: ${instanceName}`);
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      console.error(`[Evolution API] Axios error on ${endpoint}:`, error.response?.data || error.message);
    } else {
      console.error(`[Evolution API] An unexpected error occurred on ${endpoint}:`, error);
    }
    throw error;
  }
};

/**
 * Fetches a new QR code to connect an existing instance.
 * @param instanceName - The name of the instance to connect.
 * @returns The connection data, including the QR code.
 */
export const connectEvolutionInstance = async (instanceName: string) => {
  const endpoint = `/instance/connect/${instanceName}`;
  try {
    console.log(`[Evolution API] Attempting to GET ${endpoint}`);
    const response = await evolutionApiClient.get(endpoint);
    console.log(`[Evolution API] Successfully fetched new QR code for instance: ${instanceName}`);
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      console.error(`[Evolution API] Axios error on ${endpoint}:`, error.response?.data || error.message);
    } else {
      console.error(`[Evolution API] An unexpected error occurred on ${endpoint}:`, error);
    }
    throw error;
  }
};


/**
 * Fetches details for all instances from the Evolution API.
 */
export const fetchAllEvolutionInstances = async () => {
  const endpoint = '/instance/fetchInstances';
  try {
    console.log(`[Evolution API] Attempting to GET ${endpoint}`);
    const response = await evolutionApiClient.get(endpoint);
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      console.error(`[Evolution API] Axios error on ${endpoint}:`, error.response?.data || error.message);
    } else {
      console.error(`[Evolution API] An unexpected error occurred on ${endpoint}:`, error);
    }
    throw error;
  }
};
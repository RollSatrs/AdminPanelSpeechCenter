import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
console.log(API_URL)

export function apiPost(path: string, data: any) {
  return axios.post(`${API_URL}${path}`, data);
}

export function apiGet(path: string, params?: any) {
  return axios.get(`${API_URL}${path}`, { params });
}
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
})
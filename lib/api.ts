import axios from "axios";

const API_URL =  "/api";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
})

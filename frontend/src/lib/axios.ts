import axios from 'axios'

import { useAuthStore } from '../stores/authStore'

function resolveApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL

  if (typeof window === 'undefined') {
    return configuredUrl || 'http://localhost:3333'
  }

  const { hostname, protocol } = window.location
  const isCodespacesHost = hostname.endsWith('.app.github.dev')

  if (!configuredUrl) {
    return isCodespacesHost ? `${protocol}//${hostname.replace(/-\d+(?=\.app\.github\.dev$)/, '-3333')}` : 'http://localhost:3333'
  }

  const pointsToLocalhost = configuredUrl.includes('localhost') || configuredUrl.includes('127.0.0.1')

  if (isCodespacesHost && pointsToLocalhost) {
    return `${protocol}//${hostname.replace(/-\d+(?=\.app\.github\.dev$)/, '-3333')}`
  }

  return configuredUrl
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export default api
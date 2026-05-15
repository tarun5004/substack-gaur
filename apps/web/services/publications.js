import { api } from "@/services/api";

export async function getMyPublications() {
  const response = await api.get("/api/publications/mine");
  return response.data.data;
}

export async function createPublication(payload) {
  const response = await api.post("/api/publications", payload);
  return response.data.data;
}

export async function updatePublication(publicationId, payload) {
  const response = await api.patch(`/api/publications/${publicationId}`, payload);
  return response.data.data;
}

export async function getPublicationSubscribers(publicationId, params = {}) {
  const response = await api.get(`/api/publications/${publicationId}/subscribers`, { params });
  return response.data.data;
}

export async function subscribeToPublication(publicationSlug, payload) {
  const response = await api.post(`/api/publications/${publicationSlug}/subscribe`, payload);
  return response.data.data;
}

export async function unsubscribeFromPublication(publicationSlug, payload) {
  const response = await api.post(`/api/publications/${publicationSlug}/unsubscribe`, payload);
  return response.data.data;
}

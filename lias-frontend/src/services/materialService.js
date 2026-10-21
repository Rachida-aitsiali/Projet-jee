import API from './api'

const materialService = {
  getMaterials:       ()            => API.get('/materials'),
  createMaterial:     (data)        => API.post('/materials', data),
  updateMaterial:     (id, data)    => API.put(`/materials/${id}`, data),
  deleteMaterial:     (id)          => API.delete(`/materials/${id}`),
  getAssignments:     (id)          => API.get(`/materials/${id}/assignments`),
  assignMaterial:     (id, data)    => API.post(`/materials/${id}/assign`, data),
  removeAssignment:   (assignId)    => API.delete(`/materials/assignments/${assignId}`),
  getRequests:        ()            => API.get('/material-requests'),
  createRequest:      (data)        => API.post('/material-requests', data),
  validateRequest:    (id)          => API.put(`/material-requests/${id}/validate`),
  rejectRequest:      (id)          => API.put(`/material-requests/${id}/reject`),
}

export default materialService
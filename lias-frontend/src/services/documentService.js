import API from './api'

const documentService = {
  getDocuments: () => API.get('/documents'),
  createDocument: (data) => API.post('/documents', data),
  updateDocument: (id, data) => API.put(`/documents/${id}`, data),
  deleteDocument: (id) => API.delete(`/documents/${id}`)
}

export default documentService
import API from './api'

const conventionService = {
  getConventions:    ()       => API.get('/conventions'),
  createConvention:  (data)   => API.post('/conventions', data),
  updateConvention:  (id, data) => API.put(`/conventions/${id}`, data),
  deleteConvention:  (id)     => API.delete(`/conventions/${id}`),
  uploadDocument:    (id, file) => {
    const fd = new FormData()
    fd.append('file', file)
    return API.post(`/conventions/${id}/document`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

export default conventionService
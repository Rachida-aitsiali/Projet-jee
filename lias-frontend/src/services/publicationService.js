import API from './api'

const publicationService = {
    getPublications: () => API.get('/publications'),
    createPublication: (data) => API.post('/publications', data),
    updatePublication: (id, data) => API.put(`/publications/${id}`, data),
    deletePublication: (id) => API.delete(`/publications/${id}`)
};

export default publicationService;
import API from './api'

const eventService = {
  getEvents: () => API.get('/events'),
  createEvent: (data) => API.post('/events', data),
  updateEvent: (id, data) => API.put(`/events/${id}`, data),
  deleteEvent: (id) => API.delete(`/events/${id}`)
}

export default eventService
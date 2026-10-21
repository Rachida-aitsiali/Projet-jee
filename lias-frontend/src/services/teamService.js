// src/services/teamService.js
import api from './api'

const teamService = {
    getTeams: () => {
        return api.get('/teams');
    },
    createTeam: (data) => {
        return api.post('/teams', data);
    },
    updateTeam: (id, data) => {
        return api.put(`/teams/${id}`, data);
    },
    deleteTeam: (id) => {
        return api.delete(`/teams/${id}`);
    }
};

export default teamService;
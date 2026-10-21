import api from './api';

const memberService = {
    getMembers: () => {
        return api.get('/members');
    },
    createMember: (data) => {
        return api.post('/members', data);
    },
    updateMember: (id, data) => {
        return api.put(`/members/${id}`, data);
    },
    updateRole: (id, role) => {
        return api.put(`/members/${id}/role`, { role });
    },
    deleteMember: (id) => {
        return api.delete(`/members/${id}`);
    }
};

export default memberService;
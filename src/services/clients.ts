import { apiService } from './api';

export interface Client {
    id: number;
    name: string;
    token: string;
    lastUsed: Date;
}

export const clientService = {
    async getClients(): Promise<Client[]> {
        return apiService.request<Client[]>('/client');
    },

    async getClient(id: number): Promise<Client> {
        return apiService.request<Client>(`/client/${id}`);
    },

    async createClient(name: string): Promise<Client> {
        return apiService.request<Client>('/client', 'POST', { name });
    },

    async updateClient(id: number, name: string): Promise<Client> {
        return apiService.request<Client>(`/client/${id}`, 'PUT', { name });
    },

    async deleteClient(id: number): Promise<void> {
        return apiService.request(`/client/${id}`, 'DELETE');
    }
};

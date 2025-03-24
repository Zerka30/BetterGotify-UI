import { apiService } from './api';

export interface User {
    id: number;
    name: string;
    pass: string;
    role: 'admin' | 'user';
}

export const userService = {
    // Récupérer tous les utilisateurs
    getUsers: async (): Promise<User[]> => {
        return await apiService.request<User[]>('/user');
    },

    // Récupérer un utilisateur par son ID
    getUser: async (id: number): Promise<User> => {
        return await apiService.request<User>(`/user/${id}`);
    },

    // Créer un nouvel utilisateur
    createUser: async (userData: {
        name: string;
        pass: string;
        role: 'admin' | 'user';
    }): Promise<User> => {
        console.log(userData);
        return await apiService.request<User>('/user', 'POST', userData);
    },

    // Mettre à jour un utilisateur
    updateUser: async (
        id: number,
        userData: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>
    ): Promise<User> => {
        return await apiService.request<User>(`/user/${id}`, 'PUT', userData);
    },

    // Supprimer un utilisateur
    deleteUser: async (id: number): Promise<void> => {
        await apiService.request(`/user/${id}`, 'DELETE');
    },

    // Changer le mot de passe d'un utilisateur
    changePassword: async (
        id: number,
        passwords: { currentPassword: string; newPassword: string }
    ): Promise<void> => {
        await apiService.request(`/user/${id}/change-password`, 'POST', passwords);
    }
}; 
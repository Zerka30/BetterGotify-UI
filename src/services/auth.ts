import { API_CONFIG } from '../config/api';

interface LoginResponse {
    id: number;
    name: string;
    token: string;
}

export const authService = {
    async login(username: string, password: string) {
        try {
            const basicAuth = btoa(`${username}:${password}`);

            const response = await fetch(`${API_CONFIG.BASE_URL}/client`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${basicAuth}`,
                    'Origin': 'https://gotify.zerka.dev',
                    'Referer': 'https://gotify.zerka.dev/'
                },
                body: JSON.stringify({
                    name: "BetterGotify UI"
                })
            });

            if (!response.ok) {
                console.error('Status:', response.status);
                console.error('StatusText:', response.statusText);
                const errorText = await response.text();
                console.error('Error response:', errorText);

                if (response.status === 401) {
                    throw new Error('Identifiants invalides');
                }
                throw new Error(`Erreur serveur: ${response.status}`);
            }

            const data: LoginResponse = await response.json();

            localStorage.setItem('gotify-token', data.token);
            localStorage.setItem('gotify-client', JSON.stringify({
                id: data.id,
                name: data.name
            }));

            return data;
        } catch (error) {
            console.error('Erreur de connexion:', error);
            throw error;
        }
    },

    // Fonction utilitaire pour les futures requêtes API
    getAuthHeaders() {
        const token = localStorage.getItem('gotify-token');
        return {
            'X-Gotify-Key': token,
            'Content-Type': 'application/json',
            'Origin': 'https://gotify.zerka.dev',
            'Referer': 'https://gotify.zerka.dev/'
        };
    },

    logout() {
        localStorage.removeItem('gotify-token');
        localStorage.removeItem('gotify-client');
    },

    isAuthenticated() {
        return !!localStorage.getItem('gotify-token');
    },

    getToken() {
        return localStorage.getItem('gotify-token');
    },

    getClient() {
        const client = localStorage.getItem('gotify-client');
        return client ? JSON.parse(client) : null;
    }
}

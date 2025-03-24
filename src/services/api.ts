import { API_CONFIG } from '../config/api';
import { authService } from './auth';

export class ApiError extends Error {
    status: number;
    errorCode: string;
    errorDescription: string;

    constructor(status: number, message: string, errorCode: string, errorDescription: string) {
        super(message);
        this.status = status;
        this.name = 'ApiError';
        this.errorCode = errorCode;
        this.errorDescription = errorDescription;
    }
}

export const apiService = {
    async request<T>(
        endpoint: string,
        method: string = 'GET',
        body?: any,
        customHeaders: Record<string, string> = {}
    ): Promise<T> {
        const token = authService.getToken();

        if (!token) {
            throw new ApiError(401, 'Non authentifié', '', '');
        }

        const headers: Record<string, string> = {
            'Accept': 'application/json',
            'X-Gotify-Key': token,
            ...customHeaders
        };

        if (body && !(body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        const options: RequestInit = {
            method,
            headers,
            credentials: 'include'
        };

        if (body) {
            options.body = body instanceof FormData ? body : JSON.stringify(body);
        }

        try {
            console.log(`Fetching ${API_CONFIG.BASE_URL}${endpoint}`, options);
            const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, options);

            // Pour déboguer
            console.log(`Response status: ${response.status}`);
            const responseText = await response.text();
            console.log(`Response body: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);

            if (!response.ok) {
                throw new ApiError(response.status, response.statusText, '', '');
            }

            // Si la réponse est vide, retourner un objet vide
            if (!responseText) {
                return {} as T;
            }

            try {
                return JSON.parse(responseText) as T;
            } catch (e) {
                console.error('Error parsing JSON:', e);
                throw new ApiError(500, 'Invalid JSON response', '', '');
            }
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            console.error('Network error:', error);
            throw new ApiError(0, `Network error: ${error instanceof Error ? error.message : String(error)}`, '', '');
        }
    },

    async requestFormData<T>(endpoint: string, formData: FormData): Promise<T> {
        const url = `${API_CONFIG.BASE_URL}${endpoint}`;

        try {
            console.log("Sending FormData request to:", url);
            console.log("FormData contents:", Array.from(formData.entries()));

            const hasFile = Array.from(formData.entries()).some(entry =>
                entry[0] === 'file' && entry[1] instanceof File
            );

            if (!hasFile) {
                console.error("FormData does not contain a file with key 'file'");
                throw new ApiError(400, "Bad Request", "INVALID_FORM_DATA", "Le fichier est manquant");
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'X-Gotify-Key': authService.getToken() || '',
                    // Ne pas définir Content-Type, le navigateur le fera automatiquement
                },
                body: formData,
                credentials: 'include'
            });

            if (!response.ok) {
                console.error("Upload failed with status:", response.status);
                const errorText = await response.text();
                console.error("Error response:", errorText);

                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch (e) {
                    errorData = { error: errorText };
                }

                throw new ApiError(
                    response.status,
                    errorData.error || response.statusText,
                    errorData.errorCode || response.status.toString(),
                    errorData.errorDescription || 'Une erreur est survenue'
                );
            }

            return await response.json();
        } catch (error) {
            console.error("FormData request error:", error);
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, 'Erreur réseau', 'NETWORK_ERROR', 'Impossible de se connecter au serveur');
        }
    },
}; 
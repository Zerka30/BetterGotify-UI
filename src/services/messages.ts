import { apiService } from './api';

export interface Message {
    id: number;
    appid: number;
    message: string;
    title: string;
    priority: number;
    date: string;
    application: {
        id: number;
        name: string;
        description: string;
        image: string | undefined;
    };
}

export interface MessagesResponse {
    messages: Message[];
    paging: {
        since?: number;
        size: number;
        limit: number;
    };
}

export const messageService = {
    async getMessages(limit: number = 100): Promise<Message[]> {
        try {
            const data = await apiService.request<MessagesResponse>(`/message?limit=${limit}`);
            return data.messages || [];
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }
    },

    async getMessagesByApplication(appId: number, limit: number = 100): Promise<Message[]> {
        try {
            // Note: Idéalement, l'API devrait supporter un paramètre pour filtrer par appId
            // Comme ce n'est pas le cas, nous filtrons côté client
            const data = await apiService.request<MessagesResponse>(`/message?limit=${limit}`);
            const messages = data.messages || [];
            return messages.filter(msg => msg.appid === appId);
        } catch (error) {
            console.error(`Error fetching messages for application ${appId}:`, error);
            throw error;
        }
    },

    async deleteMessage(id: number): Promise<boolean> {
        try {
            await apiService.request(`/message/${id}`, 'DELETE');
            return true;
        } catch (error) {
            console.error(`Error deleting message ${id}:`, error);
            throw error;
        }
    },

    async deleteAllMessages(): Promise<boolean> {
        try {
            await apiService.request('/message', 'DELETE');
            return true;
        } catch (error) {
            console.error('Error deleting all messages:', error);
            throw error;
        }
    },

    async deleteAllMessagesByApplication(appId: number): Promise<boolean> {
        try {
            // Note: L'API ne supporte pas la suppression par application
            // Nous devons donc récupérer tous les messages de l'application et les supprimer un par un
            const messages = await this.getMessagesByApplication(appId);

            const deletePromises = messages.map(msg => this.deleteMessage(msg.id));
            await Promise.all(deletePromises);

            return true;
        } catch (error) {
            console.error(`Error deleting all messages for application ${appId}:`, error);
            throw error;
        }
    }
}; 
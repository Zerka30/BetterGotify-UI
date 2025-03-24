import { apiService } from './api';

export interface Application {
    id: number;
    name: string;
    description: string;
    token?: string;
    internal: boolean;
    image?: string;
    defaultPriority?: number;
    lastUsed?: string;
}

export const applicationService = {
    async getApplications(): Promise<Application[]> {
        try {
            return await apiService.request<Application[]>('/application');
        } catch (error) {
            console.error('Error fetching applications:', error);
            throw error;
        }
    },

    async getApplication(id: number): Promise<Application> {
        try {
            return await apiService.request<Application>(`/application/${id}`);
        } catch (error) {
            console.error(`Error fetching application ${id}:`, error);
            throw error;
        }
    },

    async createApplication(name: string, description: string): Promise<Application> {
        try {
            return await apiService.request<Application>('/application', 'POST', { name, description });
        } catch (error) {
            console.error('Error creating application:', error);
            throw error;
        }
    },

    async deleteApplication(id: number): Promise<boolean> {
        try {
            await apiService.request(`/application/${id}`, 'DELETE');
            return true;
        } catch (error) {
            console.error(`Error deleting application ${id}:`, error);
            throw error;
        }
    },

    async updateApplication(id: number, name: string, description: string): Promise<Application> {
        try {
            return await apiService.request<Application>(`/application/${id}`, 'PUT', { name, description });
        } catch (error) {
            console.error(`Error updating application ${id}:`, error);
            throw error;
        }
    },

    async uploadApplicationImage(id: number, image: File): Promise<Application> {
        try {
            const formData = new FormData();

            formData.append('file', image);

            console.log(`Uploading image for app ${id}:`, image);
            console.log("FormData entries:", Array.from(formData.entries()).map(entry => {
                if (entry[1] instanceof File) {
                    return [entry[0], `File: ${entry[1].name} (${entry[1].type})`];
                }
                return entry;
            }));

            return await apiService.requestFormData<Application>(`/application/${id}/image`, formData);
        } catch (error) {
            console.error(`Error uploading application image ${id}:`, error);
            throw error;
        }
    },

    async deleteApplicationImage(id: number): Promise<boolean> {
        try {
            console.log(`Deleting image for application ${id}`);
            const response = await apiService.request(`/application/${id}/image`, 'DELETE');
            console.log(`Image deletion response:`, response);
            return true;
        } catch (error) {
            console.error(`Error deleting application image ${id}:`, error);
            throw error;
        }
    }
}
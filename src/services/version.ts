import { apiService } from './api';

export interface VersionInfo {
    version: string;
    commit: string;
    buildDate: string;
}

export const versionService = {
    async getVersion(): Promise<VersionInfo> {
        try {
            return await apiService.request<VersionInfo>('/version');
        } catch (error) {
            console.error('Error fetching version info:', error);
            return {
                version: 'N/A',
                commit: '',
                buildDate: ''
            };
        }
    }
}; 
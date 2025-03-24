import { useState, useEffect } from 'react';
import { Application, applicationService } from '../services/applications';
import { ApiError } from '../services/api';
import AppModal from '../components/modals/App';
import ConfirmModal from '../components/modals/Confirm';
import Layout from '../components/layout/Layout';
import { getAppColor, getAppInitials, getImageUrl, hasValidImage } from '../utils/appUtils';
import { useTranslation } from 'react-i18next';

const Applications = () => {
    // States
    const [applications, setApplications] = useState<Application[]>([]);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [appToDelete, setAppToDelete] = useState<Application | null>(null);

    // Loading states
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [modalApp, setModalApp] = useState<Application | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // State for token visibility
    const [isTokenVisible, setIsTokenVisible] = useState(false);

    // Translation
    const { t } = useTranslation();

    // Load applications on component mount
    useEffect(() => {
        fetchApplications();
    }, []);

    /**
     * Fetch applications
     */
    const fetchApplications = async (): Promise<void> => {
        setIsLoading(true);
        setError(null);
        try {
            const apps = await applicationService.getApplications();
            setApplications(Array.isArray(apps) ? apps : []);
        } catch (err) {
            const errorMessage = err instanceof ApiError
                ? `Erreur ${err.status}: ${err.message}`
                : t('applications.errors.loadingFailed');
            setError(errorMessage);
            setApplications([]);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Open the application creation modal
     */
    const handleOpenCreateModal = (): void => {
        setModalMode('create');
        setModalApp(null);
        setIsModalOpen(true);
    };

    /**
     * Open the application edit modal
     */
    const handleOpenEditModal = (app: Application): void => {
        setModalMode('edit');
        setModalApp(app);
        setIsModalOpen(true);
    };

    /**
     * Close the application modal
     */
    const handleCloseModal = (): void => {
        setIsModalOpen(false);
    };

    /**
     * Save an application (creation or modification)
     */
    const handleSaveApp = async (appData: Application, image?: File, deleteImage?: boolean): Promise<void> => {
        try {
            setIsLoading(true);
            let updatedApp;

            if (appData.id === 0) {
                updatedApp = await applicationService.createApplication(appData.name, appData.description);
            } else {
                updatedApp = await applicationService.updateApplication(appData.id, appData.name, appData.description);
            }

            // Image management
            if (image) {
                updatedApp = await applicationService.uploadApplicationImage(updatedApp.id, image);
            } else if (deleteImage === true) {
                await applicationService.deleteApplicationImage(updatedApp.id);
                updatedApp = await applicationService.getApplication(updatedApp.id);
            }

            await fetchApplications();

            // Update selected application if necessary
            if (selectedApp && selectedApp.id === updatedApp.id) {
                setSelectedApp(updatedApp);
            }

            setIsModalOpen(false);
        } catch (err) {
            const errorMessage = err instanceof ApiError
                ? t('common.error') + ' ' + err.status + ': ' + err.message
                : t('applications.errors.savingFailed');
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Prepare application deletion
     */
    const handleDeleteApp = (app: Application): void => {
        setAppToDelete(app);
        setIsConfirmModalOpen(true);
    };

    /**
     * Confirm and execute application deletion
     */
    const confirmDeleteApp = async (): Promise<void> => {
        if (!appToDelete) return;

        setIsDeleting(true);
        try {
            await applicationService.deleteApplication(appToDelete.id);

            // Update applications list
            const updatedApps = applications.filter(app => app.id !== appToDelete.id);
            setApplications(updatedApps);

            // Update selected application after deletion
            if (selectedApp && selectedApp.id === appToDelete.id) {
                if (updatedApps.length > 0) {
                    setSelectedApp(updatedApps[0]);
                } else {
                    setSelectedApp(null);
                }
            }

            setIsConfirmModalOpen(false);
            setAppToDelete(null);
        } catch (err) {
            const errorMessage = err instanceof ApiError
                ? t('common.error') + ' ' + err.status + ': ' + err.message
                : t('applications.errors.deletingFailed');
            setError(errorMessage);
        } finally {
            setIsDeleting(false);
        }
    };

    /**
     * Copy the token to the clipboard
     */
    const handleCopyToken = (text: string): void => {
        navigator.clipboard.writeText(text)
            .then(() => {
                // Feedback visuel
                const tokenElement = document.querySelector('.token-display');
                if (tokenElement) {
                    tokenElement.classList.add('bg-green-100');
                    setTimeout(() => {
                        tokenElement.classList.remove('bg-green-100');
                    }, 1000);
                }
            })
            .catch(_ => {
                setError(t('applications.errors.copyingTokenFailed'));
            });
    };

    /**
     * Toggle the token visibility
     */
    const toggleTokenVisibility = (): void => {
        setIsTokenVisible(!isTokenVisible);
    };

    // Sidebar content with the applications list
    const sidebarContent = (
        <>
            {error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                    {error}
                </div>
            ) : applications.length === 0 ? (
                <div className="text-center">
                    <button
                        onClick={handleOpenCreateModal}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center space-x-3"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="ml-2">{t('applications.actions.newApplication')}</span>
                    </button>
                </div>
            ) : (
                <ul className="space-y-1">
                    {applications.map((app) => (
                        <li key={app.id}>
                            <button
                                onClick={() => setSelectedApp(app)}
                                className={`w-full text-left px-4 py-2 rounded-lg flex items-center space-x-3 ${selectedApp?.id === app.id
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {hasValidImage(app) ? (
                                    <img
                                        src={getImageUrl(app.image) || undefined}
                                        alt={`${app.name} logo`}
                                        className="flex-shrink-0 h-8 w-8 rounded-md object-contain bg-white border border-gray-200"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            const parent = e.currentTarget.parentElement;
                                            if (parent) {
                                                const div = document.createElement('div');
                                                div.className = `flex-shrink-0 h-8 w-8 rounded-md flex items-center justify-center text-white font-bold ${getAppColor(app.name)}`;
                                                div.textContent = getAppInitials(app.name);
                                                parent.appendChild(div);
                                            }
                                        }}
                                    />
                                ) : (
                                    <div className={`flex-shrink-0 h-8 w-8 rounded-md flex items-center justify-center text-white font-bold ${getAppColor(app.name)}`}>
                                        {getAppInitials(app.name)}
                                    </div>
                                )}
                                <span className="ml-2 truncate">{app.name}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {/* Button to create a new application at the bottom of the list */}
            {applications.length > 0 && !isLoading && !error && (
                <button
                    onClick={handleOpenCreateModal}
                    className="w-full text-left mt-4 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center space-x-3"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="ml-2">{t('applications.actions.newApplication')}</span>
                </button>
            )}
        </>
    );

    return (
        <Layout
            sidebarContent={sidebarContent}
            sidebarTitle={t('applications.sidebarTitle')}
            showSidebar={true}
        >
            <div className="p-6">
                {/* Page title - displayed only when no application is selected */}
                {!selectedApp && (
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">{t('applications.title')}</h1>
                    </div>
                )}

                {/* Content */}
                {selectedApp ? (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        {/* Header with image/initials and actions */}
                        <div className="relative">
                            {/* Background with a more subtle and elegant gradient */}
                            <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
                            <div className="absolute inset-0 bg-opacity-10 bg-pattern"></div>

                            {/* Header content with better spacing */}
                            <div className="absolute inset-0 flex items-center justify-between px-8">
                                <div className="flex items-center">
                                    {/* Application logo */}
                                    {hasValidImage(selectedApp) ? (
                                        <img
                                            src={getImageUrl(selectedApp.image) || undefined}
                                            alt={`${selectedApp.name} logo`}
                                            className="h-16 w-16 rounded-xl object-contain bg-white border-2 border-white border-opacity-20 shadow-lg"
                                        />
                                    ) : (
                                        <div className={`h-16 w-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg border-2 border-white border-opacity-20 ${getAppColor(selectedApp.name)}`}>
                                            {getAppInitials(selectedApp.name)}
                                        </div>
                                    )}

                                    {/* Application information */}
                                    <div className="ml-5">
                                        <h2 className="text-xl font-bold text-white tracking-tight">{selectedApp.name}</h2>
                                        <div className="flex items-center mt-1">
                                            <span className="text-blue-100 text-md">ID: {selectedApp.id}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => handleOpenEditModal(selectedApp)}
                                        className="px-3 py-1.5 rounded-md text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md transition-colors duration-200"
                                    >
                                        <span className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            {t('actions.edit')}
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteApp(selectedApp)}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-md transition-colors duration-200 ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={isDeleting}
                                    >
                                        <span className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            {t('actions.delete')}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Main information */}
                        <div className="px-6 py-5">
                            {selectedApp.description && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">{t('applications.details.description')}</h3>
                                    <p className="text-gray-700">{selectedApp.description}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">{t('applications.details.details')}</h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <dl className="space-y-4">
                                            <div className="flex justify-between">
                                                <dt className="text-sm font-medium text-gray-500">{t('applications.details.defaultPriority')}</dt>
                                                <dd className="text-sm text-gray-900">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(selectedApp.defaultPriority || 0) >= 7 ? 'bg-red-100 text-red-800' :
                                                        (selectedApp.defaultPriority || 0) >= 4 ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'
                                                        }`}>
                                                        {selectedApp.defaultPriority || 0}
                                                    </span>
                                                </dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-sm font-medium text-gray-500">{t('applications.details.lastUsed')}</dt>
                                                <dd className="text-sm text-gray-900">
                                                    {selectedApp.lastUsed ? new Date(selectedApp.lastUsed).toLocaleString() : t('applications.details.neverUsed')}
                                                </dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-sm font-medium text-gray-500">{t('applications.details.internal')}</dt>
                                                <dd className="text-sm text-gray-900">
                                                    {selectedApp.internal ? t('common.yes') : t('common.no')}
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">{t('applications.details.authToken')}</h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center mb-2">
                                            <div className="bg-white border border-gray-200 rounded px-3 py-2 font-mono text-sm text-gray-800 flex-1 overflow-x-auto token-display">
                                                {selectedApp.token ?
                                                    (isTokenVisible ? selectedApp.token : '••••••••••••••••')
                                                    : t('applications.details.tokenUnavailable')}
                                            </div>
                                            {selectedApp.token && (
                                                <>
                                                    <button
                                                        onClick={toggleTokenVisibility}
                                                        className="ml-2 inline-flex items-center p-2 border border-transparent rounded-md text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                        title={isTokenVisible ? t('applications.details.hideToken') : t('applications.details.showToken')}
                                                    >
                                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            {isTokenVisible ? (
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                            ) : (
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            )}
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => selectedApp.token && handleCopyToken(selectedApp.token)}
                                                        className="ml-1 inline-flex items-center p-2 border border-transparent rounded-md text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                        title="Copier le token"
                                                    >
                                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                        </svg>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {t('applications.details.tokenDescription')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">{t('applications.details.exampleTitle')}</h3>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="mb-2 flex items-center justify-between">
                                        <p className="text-sm font-medium text-gray-700">{t('applications.details.exampleSubtitle')}</p>
                                        <button
                                            onClick={() => handleCopyToken(`curl -X POST \\\n  "${window.location.origin}/message" \\\n  -H "X-Gotify-Key: ${selectedApp.token || 'VOTRE_TOKEN'}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"message":"Hello from cURL", "title":"Notification", "priority":${selectedApp.defaultPriority || 5}}'`)}
                                            className="text-xs text-blue-600 hover:text-blue-800"
                                        >
                                            {t('actions.copyCommand')}
                                        </button>
                                    </div>
                                    <pre className="bg-gray-800 text-white p-3 rounded text-xs overflow-x-auto">
                                        {`curl -X POST \\
  "${window.location.origin}/message" \\
  -H "Authorization: Bearer ${selectedApp.token || t('applications.details.yourToken')}" \\
  -F "title=Notification" \\
  -F "message=Hello from cURL" \\
  -F "priority=${selectedApp.defaultPriority || 5}"`}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                            {t('applications.noApplicationsSelected')}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {t('applications.noApplicationsSelectedDescription')}
                        </p>
                        <div className="mt-4">
                            <button
                                onClick={handleOpenCreateModal}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                {t('applications.actions.newApplication')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal to create/edit an application */}
            <AppModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveApp}
                mode={modalMode}
                app={modalApp}
            />

            {/* Confirmation modal for application deletion */}
            <ConfirmModal
                isOpen={isConfirmModalOpen}
                onClose={() => {
                    setIsConfirmModalOpen(false);
                    setAppToDelete(null);
                }}
                onConfirm={confirmDeleteApp}
                title={t('applications.modals.deleteApplication.title')}
                message={t('applications.modals.deleteApplication.message', { name: appToDelete?.name })}
                confirmText={t('actions.delete')}
                cancelText={t('actions.cancel')}
                isLoading={isDeleting}
                type="danger"
            />
        </Layout>
    );
};

export default Applications; 
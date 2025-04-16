import { useState, useEffect } from 'react';
import { Message, messageService } from '../services/messages';
import { Application, applicationService } from '../services/applications';
import { ApiError } from '../services/api';
import AppModal from '../components/modals/App';
import ConfirmModal from '../components/modals/Confirm';
import Layout from '../components/layout/Layout';
import { getAppColor, getAppInitials, getImageUrl, hasValidImage } from '../utils/appUtils';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
    // States
    const [messages, setMessages] = useState<Message[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [selectedAppId, setSelectedAppId] = useState<number | null>(null);

    // Loading states
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingApps, setIsLoadingApps] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [appError, setAppError] = useState<string | null>(null);
    const [isDeletingAll, setIsDeletingAll] = useState(false);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [modalApp, setModalApp] = useState<Application | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
    const [isConfirmAllModalOpen, setIsConfirmAllModalOpen] = useState(false);

    // State for application management
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);

    // Translation
    const { t } = useTranslation();

    /**
     * Fetch applications
     */
    const fetchApplications = async () => {
        setIsLoadingApps(true);
        setAppError(null);
        try {
            const apps = await applicationService.getApplications();
            setApplications(Array.isArray(apps) ? apps : []);
        } catch (err) {
            const errorMessage = err instanceof ApiError
                ? t('common.error') + ' ' + err.status + ': ' + err.message
                : t('applications.errors.loadingApplicationsFailed');
            setAppError(errorMessage);
            setApplications([]);
        } finally {
            setIsLoadingApps(false);
        }
    };

    /**
     * Fetch messages, filtered by application if appId is provided
     */
    const fetchMessages = async (appId: number | null = selectedAppId) => {
        setIsLoading(true);
        setError(null);
        setMessages([]); // Reset during loading

        try {
            let fetchedMessages;
            if (appId) {
                fetchedMessages = await messageService.getMessagesByApplication(appId);
            } else {
                fetchedMessages = await messageService.getMessages();
            }

            // Enrich with application information
            const enrichedMessages = fetchedMessages.map(message => {
                const app = applications.find(app => app.id === message.appid);
                return { ...message, application: app };
            });

            setMessages(enrichedMessages as Message[]);
        } catch (err) {
            const errorMessage = err instanceof ApiError
                ? t('common.error') + ' ' + err.status + ': ' + err.message
                : t('applications.errors.loadingMessagesFailed');
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Handle application selection and load its messages
     */
    const handleAppSelect = (appId: number | null) => {
        setSelectedAppId(appId);
        fetchMessages(appId);
    };

    /**
     * Refresh messages list
     */
    const handleRefresh = () => {
        fetchMessages();
    };

    /**
     * Prepare message deletion
     */
    const handleDeleteMessage = (message: Message) => {
        setMessageToDelete(message);
        setIsConfirmModalOpen(true);
    };

    /**
     * Confirm and execute message deletion
     */
    const confirmDeleteMessage = async () => {
        if (!messageToDelete) return;

        try {
            await messageService.deleteMessage(messageToDelete.id);
            // Filter deleted message from list
            setMessages(messages.filter(msg => msg.id !== messageToDelete.id));
            setIsConfirmModalOpen(false);
            setMessageToDelete(null);
        } catch (err) {
            const errorMessage = err instanceof ApiError
                ? t('common.error') + ' ' + err.status + ': ' + err.message
                : t('applications.errors.deletingMessageFailed');
            setError(errorMessage);
        }
    };

    /**
     * Prepare all messages deletion
     */
    const handleDeleteAllClick = () => {
        setIsConfirmAllModalOpen(true);
    };

    /**
     * Confirm and execute all messages deletion
     */
    const confirmDeleteAll = async () => {
        setIsDeletingAll(true);
        setError(null);

        try {
            if (selectedAppId) {
                await messageService.deleteAllMessagesByApplication(selectedAppId);
            } else {
                await messageService.deleteAllMessages();
            }
            setMessages([]);
            setIsConfirmAllModalOpen(false);
        } catch (err) {
            const errorMessage = err instanceof ApiError
                ? t('common.error') + ' ' + err.status + ': ' + err.message
                : t('applications.errors.deletingAllMessagesFailed');
            setError(errorMessage);
        } finally {
            setIsDeletingAll(false);
        }
    };

    /**
     * Open application creation modal
     */
    const handleOpenCreateModal = () => {
        setModalMode('create');
        setModalApp(null);
        setIsModalOpen(true);
    };

    /**
     * Close application modal
     */
    const handleCloseModal = (): void => {
        setIsModalOpen(false);
    };

    /**
     * Save application (creation or modification)
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
                ? `Erreur ${err.status}: ${err.message}`
                : t('errors.application.errorSaving');
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial loading
    useEffect(() => {
        fetchApplications();
        fetchMessages();
    }, []);

    // Sidebar content
    const sidebarContent = (
        <>
            {/* All messages */}
            <button
                onClick={() => handleAppSelect(null)}
                className={`w-full text-left px-4 py-2 rounded-lg flex items-center space-x-3 ${selectedAppId === null
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                    }`}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <span>{t('applications.messages.allMessages')}</span>
            </button>

            <div className="border-t border-gray-200 my-4"></div>

            {/* Applications header */}
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex justify-between items-center">
                <span>{t('applications.title')}</span>
                {isLoadingApps && (
                    <svg className="animate-spin h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
            </div>

            {/* Applications error */}
            {appError && (
                <div className="px-4 py-2 text-xs text-red-600 bg-red-50 rounded-md">
                    {appError}
                </div>
            )}

            {/* Applications list */}
            <div className="space-y-1">
                {applications.length === 0 && !isLoadingApps && !appError ? (
                    <div className="px-4 py-2 text-sm text-gray-500">
                        {t('applications.noApplications')}
                    </div>
                ) : (
                    applications.map((app) => (
                        <button
                            key={app.id}
                            onClick={() => handleAppSelect(app.id)}
                            className={`w-full text-left px-4 py-2 rounded-lg flex items-center space-x-3 ${selectedAppId === app.id
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {hasValidImage(app) ? (
                                <img
                                    src={getImageUrl(app.image) || undefined}
                                    alt={`${app.name} logo`}
                                    className="flex-shrink-0 h-8 w-8 rounded-md object-contain bg-white border border-gray-200"
                                />
                            ) : (
                                <div className={`flex-shrink-0 h-8 w-8 rounded-md flex items-center justify-center text-white text-xs font-bold ${getAppColor(app.name)}`}>
                                    {getAppInitials(app.name)}
                                </div>
                            )}
                            <span className="truncate">{app.name}</span>
                        </button>
                    ))
                )}
            </div>

            {/* Add application button */}
            <button
                className="w-full text-left mt-4 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center space-x-3"
                onClick={handleOpenCreateModal}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>{t('applications.actions.newApplication')}</span>
            </button>
        </>
    );

    return (
        <Layout
            sidebarContent={sidebarContent}
            sidebarTitle="Applications"
            showSidebar={true}
        >
            <div className="p-6">
                {/* Page title */}
                <h1 className="text-2xl font-bold text-gray-900 mb-6">
                    {selectedAppId
                        ? applications.find(app => app.id === selectedAppId)?.name || t('applications.application.name')
                        : t('applications.messages.allMessages')
                    }
                </h1>

                {/* Header with statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('applications.messages.name')}</h3>
                        <p className="text-3xl font-bold text-blue-600">{messages.length}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('applications.title')}</h3>
                        <p className="text-3xl font-bold text-blue-600">{applications.length}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Clients</h3>
                        <p className="text-3xl font-bold text-blue-600">0</p>
                    </div>
                </div>

                {/* Messages list */}
                <div className="bg-white rounded-lg shadow mb-16 flex flex-col">
                    <div className="p-4 md:p-6 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <h2 className="text-xl font-semibold text-gray-900">{t('applications.messages.recentMessages')}</h2>
                            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                                <button
                                    onClick={handleRefresh}
                                    disabled={isLoading || isDeletingAll}
                                    className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    <svg
                                        className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                    </svg>
                                    {isLoading ? t('common.loading') : t('actions.refresh')}
                                </button>

                                <button
                                    onClick={handleDeleteAllClick}
                                    disabled={isLoading || isDeletingAll || messages.length === 0}
                                    className="inline-flex items-center justify-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                >
                                    <svg
                                        className={`h-4 w-4 mr-1 ${isDeletingAll ? 'animate-pulse' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                    {isDeletingAll ? t('common.deleting') : t('actions.deleteAll')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border-l-4 border-red-500">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <div
                        ref={messagesContainerRef}
                        className="overflow-y-auto max-h-full md:h-[500px] relative"
                        onScroll={handleScroll}
                    >
                        <div className="divide-y divide-gray-200">
                            {isLoading ? (
                                <div className="p-6 text-center">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="p-6 text-center text-gray-500">
                                    {t('applications.messages.noMessages')}
                                </div>
                            ) : (
                                messages.map((message) => {
                                    // Find corresponding application
                                    const app = message.application || applications.find(app => app.id === message.appid);

                                    return (
                                        <div key={message.id} className="p-4 md:p-6 hover:bg-gray-50">
                                            <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-4">
                                                {/* Application logo/avatar */}
                                                <div className="flex-shrink-0 mb-3 sm:mb-0">
                                                    {app && hasValidImage(app) ? (
                                                        <img
                                                            src={getImageUrl(app.image) || undefined}
                                                            alt={`${app.name || 'App'} logo`}
                                                            className="h-10 w-10 md:h-12 md:w-12 rounded-md object-contain bg-white border border-gray-200"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                const parent = e.currentTarget.parentElement;
                                                                if (parent) {
                                                                    const div = document.createElement('div');
                                                                    div.className = `h-10 w-10 md:h-12 md:w-12 rounded-md flex items-center justify-center text-white font-bold ${getAppColor(app?.name || 'App')}`;
                                                                    div.textContent = getAppInitials(app?.name || 'App');
                                                                    parent.appendChild(div);
                                                                }
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className={`h-10 w-10 md:h-12 md:w-12 rounded-md flex items-center justify-center text-white font-bold ${getAppColor(app?.name || 'App')}`}>
                                                            {getAppInitials(app?.name || 'App')}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Message content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                                        <h3 className="text-base md:text-lg font-medium text-gray-900 truncate">
                                                            {message.title}
                                                        </h3>
                                                        <div className="flex items-center justify-between sm:justify-end sm:space-x-2 mt-1 sm:mt-0">
                                                            <span className="text-xs md:text-sm text-gray-500">
                                                                {new Date(message.date).toLocaleString()}
                                                            </span>

                                                            {/* Delete button */}
                                                            <button
                                                                onClick={() => handleDeleteMessage(message)}
                                                                className="ml-2 text-gray-400 hover:text-red-500 focus:outline-none"
                                                                title={t('applications.actions.deleteMessage')}
                                                            >
                                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap line-clamp-3 md:line-clamp-none">
                                                        {message.message}
                                                    </p>

                                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            {app?.name || 'Application inconnue'}
                                                        </span>

                                                        {/* Priority indicator */}
                                                        {message.priority > 0 && (
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${message.priority >= 8 ? 'bg-red-100 text-red-800' :
                                                                message.priority >= 4 ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-green-100 text-green-800'
                                                                }`}>
                                                                Priorité: {message.priority}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Scroll to top button */}
            <button
                onClick={(e) => {
                    e.preventDefault();
                    scrollToTop();
                }}
                className={`fixed bottom-20 right-4 md:bottom-24 md:right-8 p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 z-50 transition-opacity duration-300 ${showScrollTop ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                aria-label="Retour en haut"
            >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
            </button>

            {/* Application creation modal */}
            <AppModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveApp}
                mode={modalMode}
                app={modalApp}
            />

            {/* Confirmation modal for message deletion */}
            <ConfirmModal
                isOpen={isConfirmModalOpen}
                onClose={() => {
                    setIsConfirmModalOpen(false);
                    setMessageToDelete(null);
                }}
                onConfirm={confirmDeleteMessage}
                title="Supprimer le message"
                message={`Êtes-vous sûr de vouloir supprimer ce message de "${messageToDelete?.application?.name || 'Application inconnue'}" ?`}
                confirmText="Supprimer"
                cancelText="Annuler"
                type="danger"
            />

            {/* Confirmation modal for all messages deletion */}
            <ConfirmModal
                isOpen={isConfirmAllModalOpen}
                onClose={() => setIsConfirmAllModalOpen(false)}
                onConfirm={confirmDeleteAll}
                title="Supprimer tous les messages"
                message={selectedAppId
                    ? `Êtes-vous sûr de vouloir supprimer tous les messages de cette application ?`
                    : `Êtes-vous sûr de vouloir supprimer tous les messages de toutes les applications ?`}
                confirmText="Supprimer tout"
                cancelText="Annuler"
                isLoading={isDeletingAll}
                type="danger"
            />
        </Layout>
    );
};

export default Dashboard; 
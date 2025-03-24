import { useState, useEffect } from 'react';
import { Message, messageService } from '../services/messages';
import { Application, applicationService } from '../services/applications';
import { ApiError } from '../services/api';
import AppModal from '../components/modals/App';
import ConfirmModal from '../components/modals/Confirm';
import Layout from '../components/layout/Layout';

const Dashboard = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingApps, setIsLoadingApps] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [appError, setAppError] = useState<string | null>(null);
    const [isDeletingAll, setIsDeletingAll] = useState(false);

    // États pour le modal de création d'application    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [modalApp, setModalApp] = useState<Application | null>(null);
    const [newAppName, setNewAppName] = useState('');
    const [newAppDescription, setNewAppDescription] = useState('');
    const [isCreatingApp, setIsCreatingApp] = useState(false);
    const [createAppError, setCreateAppError] = useState<string | null>(null);

    // États pour le modal de confirmation
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
    const [isConfirmAllModalOpen, setIsConfirmAllModalOpen] = useState(false);

    const fetchApplications = async () => {
        setIsLoadingApps(true);
        setAppError(null);
        try {
            const apps = await applicationService.getApplications();
            setApplications(Array.isArray(apps) ? apps : []);
        } catch (err) {
            console.error('Error fetching applications:', err);
            setAppError('Impossible de charger les applications');
            setApplications([]);
        } finally {
            setIsLoadingApps(false);
        }
    };

    const fetchMessages = async () => {
        setIsLoading(true);
        setError(null);
        try {
            let fetchedMessages;
            if (selectedAppId) {
                fetchedMessages = await messageService.getMessagesByApplication(selectedAppId);
            } else {
                fetchedMessages = await messageService.getMessages();
            }

            // Enrichir les messages avec les informations complètes des applications
            const enrichedMessages = fetchedMessages.map(message => {
                // Trouver l'application correspondante dans la liste des applications
                const app = applications.find(app => app.id === message.appid);
                return {
                    ...message,
                    application: app // Ajouter l'objet application complet au message
                };
            });

            setMessages(enrichedMessages);
        } catch (err) {
            console.error('Error fetching messages:', err);
            if (err instanceof ApiError) {
                setError(`Erreur ${err.status}: ${err.message}`);
            } else {
                setError('Erreur lors du chargement des messages');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleAppSelect = (appId: number | null) => {
        setSelectedAppId(appId);
        setIsLoading(true);

        // Réinitialiser les messages pendant le chargement
        setMessages([]);

        if (appId) {
            messageService.getMessagesByApplication(appId)
                .then(data => {
                    setMessages(Array.isArray(data) ? data : []);
                })
                .catch(err => {
                    console.error(`Error fetching messages for app ${appId}:`, err);
                    if (err instanceof ApiError) {
                        setError(`Erreur ${err.status}: ${err.message}`);
                    } else {
                        setError('Erreur lors du chargement des messages');
                    }
                    setMessages([]);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            messageService.getMessages()
                .then(data => {
                    setMessages(Array.isArray(data) ? data : []);
                })
                .catch(err => {
                    console.error('Error fetching all messages:', err);
                    if (err instanceof ApiError) {
                        setError(`Erreur ${err.status}: ${err.message}`);
                    } else {
                        setError('Erreur lors du chargement des messages');
                    }
                    setMessages([]);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    };

    const handleRefresh = () => {
        fetchMessages();
    };

    const handleDeleteMessage = (message: Message) => {
        setMessageToDelete(message);
        setIsConfirmModalOpen(true);
    };

    const confirmDeleteMessage = async () => {
        if (!messageToDelete) return;

        try {
            await messageService.deleteMessage(messageToDelete.id);
            // Filtrer le message supprimé de la liste
            setMessages(messages.filter(msg => msg.id !== messageToDelete.id));
            setIsConfirmModalOpen(false);
            setMessageToDelete(null);
        } catch (err) {
            console.error(`Error deleting message ${messageToDelete.id}:`, err);
            setError('Erreur lors de la suppression du message');
        }
    };

    const handleDeleteAllClick = () => {
        setIsConfirmAllModalOpen(true);
    };

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
            console.error('Error deleting messages:', err);
            if (err instanceof ApiError) {
                setError(`Erreur ${err.status}: ${err.message}`);
            } else {
                setError('Erreur lors de la suppression des messages');
            }
        } finally {
            setIsDeletingAll(false);
        }
    };

    const handleOpenCreateModal = () => {
        setModalMode('create');
        setModalApp(null);
        setIsModalOpen(true);
    };

    const handleCloseCreateModal = () => {
        setIsModalOpen(false);
    };

    // Fonction pour créer une nouvelle application
    const handleCreateApplication = async () => {
        if (!newAppName.trim() || !newAppDescription.trim()) {
            setCreateAppError('Le nom et la description sont requis');
            return;
        }

        setIsCreatingApp(true);
        setCreateAppError(null);

        try {
            await applicationService.createApplication(newAppName, newAppDescription);
            fetchApplications();
            handleCloseCreateModal();
        } catch (err) {
            console.error('Error creating application:', err);
            setCreateAppError('Erreur lors de la création de l\'application');
        } finally {
            setIsCreatingApp(false);
        }
    };

    useEffect(() => {
        // Ajouter un log pour voir les applications chargées
        console.log("Applications chargées:", applications);

        // Vérifier les images des applications
        applications.forEach(app => {
            console.log(`App ${app.id} (${app.name}) - Image:`, app.image);
        });

        fetchApplications();
        fetchMessages();
    }, []);

    // Ajouter un log pour voir les messages chargés
    useEffect(() => {
        console.log("Messages chargés:", messages);

        // Vérifier les applications associées aux messages
        messages.forEach(message => {
            console.log(`Message ${message.id} - App:`, message.application);
            if (message.application) {
                console.log(`  App image:`, message.application.image);
            }
        });
    }, [messages]);

    // Fonction pour générer une couleur basée sur le nom de l'application
    const getAppColor = (appName: string) => {
        const colors = [
            'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
            'bg-red-500', 'bg-purple-500', 'bg-pink-500',
            'bg-indigo-500', 'bg-teal-500', 'bg-orange-500'
        ];

        const sum = appName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[sum % colors.length];
    };

    // Fonction pour obtenir les initiales de l'application
    const getAppInitials = (appName: string) => {
        if (!appName) return '?';
        return appName.split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    // Ajouter ces fonctions pour gérer les images d'applications
    const getImageUrl = (imagePath: string | undefined) => {
        if (!imagePath) return null;
        if (imagePath === 'static/defaultapp.png') return null;
        if (imagePath.startsWith('http')) return imagePath;
        return `https://gotify.zerka.dev/${imagePath}`;
    };

    const hasValidImage = (app: Application | undefined) => {
        return app?.image && app.image !== 'static/defaultapp.png';
    };

    // Contenu de la sidebar
    const sidebarContent = (
        <>
            {/* Tous les messages */}
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
                <span>Tous les messages</span>
            </button>

            {/* Séparateur */}
            <div className="border-t border-gray-200 my-4"></div>

            {/* En-tête Applications */}
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex justify-between items-center">
                <span>Applications</span>
                {isLoadingApps && (
                    <svg className="animate-spin h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
            </div>

            {/* Erreur applications */}
            {appError && (
                <div className="px-4 py-2 text-xs text-red-600 bg-red-50 rounded-md">
                    {appError}
                </div>
            )}

            {/* Liste des applications */}
            <div className="space-y-1">
                {applications.length === 0 && !isLoadingApps && !appError ? (
                    <div className="px-4 py-2 text-sm text-gray-500">
                        Aucune application
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
                            {app.image && app.image !== 'static/defaultapp.png' ? (
                                <img
                                    src={app.image.startsWith('http') ? app.image : `https://gotify.zerka.dev/${app.image}`}
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

            {/* Bouton Ajouter une application */}
            <button
                className="w-full text-left mt-4 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center space-x-3"
                onClick={handleOpenCreateModal}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Nouvelle application</span>
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
                {/* Titre de la page */}
                <h1 className="text-2xl font-bold text-gray-900 mb-6">
                    {selectedAppId
                        ? applications.find(app => app.id === selectedAppId)?.name || 'Application'
                        : 'Tous les messages'
                    }
                </h1>

                {/* En-tête avec statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Messages</h3>
                        <p className="text-3xl font-bold text-blue-600">{messages.length}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Applications</h3>
                        <p className="text-3xl font-bold text-blue-600">{applications.length}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Clients</h3>
                        <p className="text-3xl font-bold text-blue-600">0</p>
                    </div>
                </div>

                {/* Liste des messages */}
                <div className="bg-white rounded-lg shadow mb-16">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900">Messages récents</h2>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={handleRefresh}
                                    disabled={isLoading || isDeletingAll}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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
                                    {isLoading ? 'Chargement...' : 'Rafraîchir'}
                                </button>

                                <button
                                    onClick={handleDeleteAllClick}
                                    disabled={isLoading || isDeletingAll || messages.length === 0}
                                    className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
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
                                    {isDeletingAll ? 'Suppression...' : 'Supprimer tout'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border-l-4 border-red-500">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <div className="divide-y divide-gray-200">
                        {isLoading ? (
                            <div className="p-6 text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">
                                Aucun message
                            </div>
                        ) : (
                            messages.map((message) => {
                                // Trouver l'application correspondante (au cas où elle n'aurait pas été ajoutée lors du chargement)
                                const app = message.application || applications.find(app => app.id === message.appid);

                                // Log pour le débogage
                                console.log(`Rendu du message ${message.id}:`, message);
                                console.log(`  AppID:`, message.appid);
                                console.log(`  Application trouvée:`, app);

                                return (
                                    <div key={message.id} className="p-6 hover:bg-gray-50">
                                        <div className="flex items-start space-x-4">
                                            {/* Logo/Avatar de l'application */}
                                            {app && app.image && app.image !== 'static/defaultapp.png' ? (
                                                <img
                                                    src={app.image.startsWith('http')
                                                        ? app.image
                                                        : `https://gotify.zerka.dev/${app.image}`}
                                                    alt={`${app.name || 'App'} logo`}
                                                    className="flex-shrink-0 h-12 w-12 rounded-md object-contain bg-white border border-gray-200"
                                                    onError={(e) => {
                                                        console.error(`Erreur de chargement de l'image pour le message ${message.id}`);
                                                        e.currentTarget.style.display = 'none';
                                                        const parent = e.currentTarget.parentElement;
                                                        if (parent) {
                                                            const div = document.createElement('div');
                                                            div.className = `flex-shrink-0 h-12 w-12 rounded-md flex items-center justify-center text-white font-bold ${getAppColor(app?.name || 'App')}`;
                                                            div.textContent = getAppInitials(app?.name || 'App');
                                                            parent.appendChild(div);
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <div className={`flex-shrink-0 h-12 w-12 rounded-md flex items-center justify-center text-white font-bold ${getAppColor(app?.name || 'App')}`}>
                                                    {getAppInitials(app?.name || 'App')}
                                                </div>
                                            )}

                                            {/* Contenu du message */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-lg font-medium text-gray-900 truncate">
                                                        {message.title}
                                                    </h3>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-sm text-gray-500">
                                                            {new Date(message.date).toLocaleString()}
                                                        </span>

                                                        {/* Bouton de suppression */}
                                                        <button
                                                            onClick={() => handleDeleteMessage(message)}
                                                            className="text-gray-400 hover:text-red-500 focus:outline-none"
                                                            title="Supprimer ce message"
                                                        >
                                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>

                                                <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
                                                    {message.message}
                                                </p>

                                                <div className="mt-2 flex items-center">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {app?.name || 'Application inconnue'}
                                                    </span>

                                                    {/* Indicateur de priorité */}
                                                    {message.priority > 0 && (
                                                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${message.priority >= 8 ? 'bg-red-100 text-red-800' :
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

            {/* Modal de création d'application */}
            <AppModal
                isOpen={isModalOpen}
                onClose={handleCloseCreateModal}
                onSave={handleCreateApplication}
                mode={modalMode}
                app={modalApp}
            />

            {/* Modal de confirmation pour supprimer un message */}
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

            {/* Modal de confirmation pour supprimer tous les messages */}
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
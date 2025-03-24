import { useState, useEffect } from 'react';
import { Application, applicationService } from '../services/applications';
import { ApiError } from '../services/api';
import AppModal from '../components/modals/App';
import ConfirmModal from '../components/modals/Confirm';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';

const Applications = () => {
    // Application states
    const [applications, setApplications] = useState<Application[]>([]);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [appToDelete, setAppToDelete] = useState<Application | null>(null);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [modalApp, setModalApp] = useState<Application | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // UI states
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isTokenVisible, setIsTokenVisible] = useState(false);

    const navigate = useNavigate();

    // Generate a consistent color based on app name
    const getAppColor = (name: string) => {
        const colors = [
            'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
            'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
        ];
        const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
        return colors[index];
    };

    const getAppInitials = (name: string): string => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const getImageUrl = (imagePath: string | undefined): string | null => {
        if (!imagePath) return null;
        if (imagePath === 'static/defaultapp.png') return null;
        if (imagePath.startsWith('http')) return imagePath;
        return `https://gotify.zerka.dev/${imagePath}`;
    };

    const hasValidImage = (app: Application): boolean => {
        return Boolean(app.image && app.image !== 'static/defaultapp.png');
    };

    // Load applications on component mount
    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async (): Promise<void> => {
        setIsLoading(true);
        setError(null);
        try {
            const apps = await applicationService.getApplications();
            setApplications(Array.isArray(apps) ? apps : []);
        } catch (err) {
            console.error('Error fetching applications:', err);
            if (err instanceof ApiError) {
                setError(`Erreur ${err.status}: ${err.message}`);
            } else {
                setError('Erreur lors du chargement des applications');
            }
            setApplications([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Modal handlers
    const handleOpenCreateModal = (): void => {
        setModalMode('create');
        setModalApp(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (app: Application): void => {
        setModalMode('edit');
        setModalApp(app);
        setIsModalOpen(true);
    };

    const handleCloseModal = (): void => {
        setIsModalOpen(false);
    };

    const handleSaveApp = async (appData: Application, image?: File, deleteImage?: boolean): Promise<void> => {
        try {
            setIsLoading(true);
            let updatedApp;

            if (appData.id === 0) {
                updatedApp = await applicationService.createApplication(appData.name, appData.description);
            } else {
                updatedApp = await applicationService.updateApplication(appData.id, appData.name, appData.description);
            }

            // Handle image upload or deletion
            if (image) {
                updatedApp = await applicationService.uploadApplicationImage(updatedApp.id, image);
            } else if (deleteImage === true) {
                await applicationService.deleteApplicationImage(updatedApp.id);
                updatedApp = await applicationService.getApplication(updatedApp.id);
            }

            await fetchApplications();

            // Update selected app if needed
            if (selectedApp && selectedApp.id === updatedApp.id) {
                setSelectedApp(updatedApp);
            }

            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving application:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteApp = (app: Application): void => {
        setAppToDelete(app);
        setIsConfirmModalOpen(true);
    };

    const confirmDeleteApp = async (): Promise<void> => {
        if (!appToDelete) return;

        setIsDeleting(true);
        try {
            await applicationService.deleteApplication(appToDelete.id);

            setApplications(applications.filter(app => app.id !== appToDelete.id));

            // Handle selected app after deletion
            if (selectedApp && selectedApp.id === appToDelete.id) {
                const nextApp = applications.find(app => app.id !== appToDelete.id);
                if (nextApp) {
                    setSelectedApp(nextApp);
                } else {
                    navigate('/');
                }
            }

            setIsConfirmModalOpen(false);
            setAppToDelete(null);
        } catch (error) {
            console.error('Error deleting application:', error);
            setError('Erreur lors de la suppression de l\'application');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSelectApp = (app: Application): void => {
        setSelectedApp(app);
    };

    // Token management
    const handleCopyToken = (token: string): void => {
        navigator.clipboard.writeText(token)
            .then(() => {
                alert('Token copié dans le presse-papiers');
            })
            .catch(err => {
                console.error('Erreur lors de la copie du token:', err);
                alert('Erreur lors de la copie du token');
            });
    };

    const toggleTokenVisibility = (): void => {
        setIsTokenVisible(!isTokenVisible);
    };

    // Render app icon or initials placeholder
    const renderAppIcon = (app: Application) => {
        if (hasValidImage(app)) {
            return (
                <img
                    src={getImageUrl(app.image)}
                    alt={`${app.name} logo`}
                    className="flex-shrink-0 h-8 w-8 rounded-md object-contain bg-white border border-gray-200"
                />
            );
        }

        return (
            <div className={`flex-shrink-0 h-8 w-8 rounded-md flex items-center justify-center text-white ${getAppColor(app.name)}`}>
                {getAppInitials(app.name)}
            </div>
        );
    };

    // Sidebar content with app list
    const sidebarContent = (
        <>
            {/* List of applications */}
            {error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                    {error}
                </div>
            ) : !Array.isArray(applications) ? (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md text-sm">
                    Erreur de chargement des applications
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
                        <span className="ml-2">Nouvelle application</span>
                    </button>
                </div>
            ) : (
                <ul className="space-y-1">
                    {applications.map(app => (
                        <li key={app.id}>
                            <button
                                onClick={() => handleSelectApp(app)}
                                className={`w-full text-left px-4 py-2 rounded-lg flex items-center space-x-3 ${selectedApp?.id === app.id
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {renderAppIcon(app)}
                                <span className="ml-2 truncate">{app.name}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {applications.length > 0 && !isLoading && !error && (
                <button
                    onClick={handleOpenCreateModal}
                    className="w-full text-left mt-4 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center space-x-3"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="ml-2">Nouvelle application</span>
                </button>
            )}
        </>
    );

    return (
        <Layout
            sidebarContent={sidebarContent}
            sidebarTitle="Applications"
            showSidebar={true}
        >
            <div className="p-6">
                {/* Page title - only displayed when no app is selected */}
                {!selectedApp && (
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
                    </div>
                )}

                {/* Content */}
                {selectedApp ? (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        {/* Header with image/initials and actions */}
                        <div className="relative">
                            {/* Background with a more subtle and elegant gradient, but lower */}
                            <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>

                            {/* Overlay with a subtle pattern to add texture */}
                            <div className="absolute inset-0 bg-opacity-10 bg-pattern"></div>

                            {/* Header content with better spacing */}
                            <div className="absolute inset-0 flex items-center justify-between px-8">
                                <div className="flex items-center">
                                    {/* Image or initials with a softer shadow and border effect, but smaller */}
                                    {hasValidImage(selectedApp) ? (
                                        <div className="p-1 bg-white rounded-xl shadow-lg">
                                            <img
                                                src={getImageUrl(selectedApp.image)}
                                                alt={`${selectedApp.name} logo`}
                                                className="h-16 w-16 rounded-lg object-contain"
                                            />
                                        </div>
                                    ) : (
                                        <div className={`h-16 w-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg border-2 border-white border-opacity-20 ${getAppColor(selectedApp.name)}`}>
                                            {getAppInitials(selectedApp.name)}
                                        </div>
                                    )}

                                    {/* Informations with an improved typography */}
                                    <div className="ml-5">
                                        <h2 className="text-xl font-bold text-white tracking-tight">{selectedApp.name}</h2>
                                        <div className="flex items-center mt-1">
                                            <span className="text-blue-100 text-md">ID: {selectedApp.id}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action buttons with a more modern design */}
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => handleOpenEditModal(selectedApp)}
                                        className="px-3 py-1.5 rounded-md text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md transition-colors duration-200"
                                    >
                                        <span className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Modifier
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
                                            Supprimer
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Main information */}
                        <div className="px-6 py-5">
                            {selectedApp.description && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Description</h3>
                                    <p className="text-gray-700">{selectedApp.description}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Détails</h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <dl className="space-y-4">
                                            <div className="flex justify-between">
                                                <dt className="text-sm font-medium text-gray-500">Priorité par défaut</dt>
                                                <dd className="text-sm text-gray-900">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedApp.defaultPriority >= 7 ? 'bg-red-100 text-red-800' :
                                                        selectedApp.defaultPriority >= 4 ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'
                                                        }`}>
                                                        {selectedApp.defaultPriority}
                                                    </span>
                                                </dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-sm font-medium text-gray-500">Dernière utilisation</dt>
                                                <dd className="text-sm text-gray-900">
                                                    {selectedApp.lastUsed ? new Date(selectedApp.lastUsed).toLocaleString() : 'Jamais utilisée'}
                                                </dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-sm font-medium text-gray-500">Application interne</dt>
                                                <dd className="text-sm text-gray-900">
                                                    {selectedApp.internal ? 'Oui' : 'Non'}
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Token d'authentification</h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center mb-2">
                                            <div className="bg-white border border-gray-200 rounded px-3 py-2 font-mono text-sm text-gray-800 flex-1 overflow-x-auto">
                                                {selectedApp.token ?
                                                    (isTokenVisible ? selectedApp.token : '••••••••••••••••')
                                                    : 'Token non disponible'}
                                            </div>
                                            {selectedApp.token && (
                                                <>
                                                    <button
                                                        onClick={toggleTokenVisibility}
                                                        className="ml-2 inline-flex items-center p-2 border border-transparent rounded-md text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                        title={isTokenVisible ? "Masquer le token" : "Afficher le token"}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                                d={isTokenVisible
                                                                    ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                                                    : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                                }
                                                            />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleCopyToken(selectedApp.token || '')}
                                                        className="ml-2 inline-flex items-center p-2 border border-transparent rounded-md text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                        title="Copier le token"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                        </svg>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Ce token est utilisé pour authentifier les requêtes à l'API Gotify.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Exemples d'utilisation</h3>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="mb-2 flex items-center justify-between">
                                        <p className="text-sm font-medium text-gray-700">Envoyer un message avec cURL</p>
                                        <button
                                            onClick={() => handleCopyToken(`curl -X POST \\\n  "${window.location.origin}/message" \\\n  -H "X-Gotify-Key: ${selectedApp.token || 'VOTRE_TOKEN'}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"message":"Hello from cURL", "title":"Notification", "priority":${selectedApp.defaultPriority || 5}}'`)}
                                            className="text-xs text-blue-600 hover:text-blue-800"
                                        >
                                            Copier la commande
                                        </button>
                                    </div>
                                    <pre className="bg-gray-800 text-white p-3 rounded text-xs overflow-x-auto">
                                        {`curl -X POST \\
  "${window.location.origin}/message" \\
  -H "Authorization: Bearer ${selectedApp.token || 'VOTRE_TOKEN'}" \\
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
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune application sélectionnée</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Sélectionnez une application dans la liste ou créez-en une nouvelle.
                        </p>
                        <div className="mt-4">
                            <button
                                onClick={handleOpenCreateModal}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Nouvelle application
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
                title="Supprimer l'application"
                message={`Êtes-vous sûr de vouloir supprimer l'application "${appToDelete?.name}" ? Cette action est irréversible et supprimera également tous les messages associés.`}
                confirmText="Supprimer"
                cancelText="Annuler"
                isLoading={isDeleting}
                type="danger"
            />
        </Layout>
    );
};

export default Applications; 
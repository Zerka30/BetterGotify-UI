import { useState, useEffect } from 'react';
import { Client, clientService } from '../services/clients';
import { ApiError } from '../services/api';
import ConfirmModal from '../components/modals/Confirm';
import Layout from '../components/layout/Layout';

const Clients = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // États pour le modal de création/édition
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [clientName, setClientName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // États pour le modal de confirmation de suppression
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Charger les clients au chargement de la page
    useEffect(() => {
        fetchClients();
    }, []);

    // Fonction pour récupérer les clients
    const fetchClients = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedClients = await clientService.getClients();
            setClients(fetchedClients);

            // Sélectionner le premier client par défaut s'il n'y a pas de client sélectionné
            if (fetchedClients.length > 0 && !selectedClient) {
                setSelectedClient(fetchedClients[0]);
            }
        } catch (err) {
            console.error('Error fetching clients:', err);
            if (err instanceof ApiError) {
                setError(`Erreur ${err.status}: ${err.message}`);
            } else {
                setError('Erreur lors du chargement des clients');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Ouvrir le modal de création
    const handleOpenCreateModal = () => {
        setModalMode('create');
        setClientName('');
        setIsModalOpen(true);
    };

    // Ouvrir le modal d'édition
    const handleOpenEditModal = (client: Client) => {
        setModalMode('edit');
        setClientName(client.name);
        setSelectedClient(client);
        setIsModalOpen(true);
    };

    // Fermer le modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setClientName('');
    };

    // Créer ou mettre à jour un client
    const handleSaveClient = async () => {
        if (!clientName.trim()) {
            return;
        }

        setIsProcessing(true);
        try {
            let updatedClient;

            if (modalMode === 'create') {
                // Créer un nouveau client
                updatedClient = await clientService.createClient(clientName);
                setClients([...clients, updatedClient]);
                setSelectedClient(updatedClient);
            } else if (selectedClient) {
                // Mettre à jour un client existant
                updatedClient = await clientService.updateClient(selectedClient.id, clientName);
                setClients(clients.map(client =>
                    client.id === updatedClient.id ? updatedClient : client
                ));
                setSelectedClient(updatedClient);
            }

            handleCloseModal();
        } catch (err) {
            console.error('Error saving client:', err);
            if (err instanceof ApiError) {
                setError(`Erreur ${err.status}: ${err.message}`);
            } else {
                setError('Erreur lors de l\'enregistrement du client');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    // Ouvrir le modal de confirmation de suppression
    const handleDeleteClient = (client: Client) => {
        setClientToDelete(client);
        setIsConfirmModalOpen(true);
    };

    // Confirmer la suppression d'un client
    const confirmDeleteClient = async () => {
        if (!clientToDelete) return;

        setIsDeleting(true);
        try {
            await clientService.deleteClient(clientToDelete.id);

            // Mettre à jour la liste des clients
            const updatedClients = clients.filter(client => client.id !== clientToDelete.id);
            setClients(updatedClients);

            // Si le client supprimé était sélectionné, sélectionner le premier client restant
            if (selectedClient && selectedClient.id === clientToDelete.id) {
                if (updatedClients.length > 0) {
                    setSelectedClient(updatedClients[0]);
                } else {
                    setSelectedClient(null);
                }
            }

            setIsConfirmModalOpen(false);
            setClientToDelete(null);
        } catch (err) {
            console.error('Error deleting client:', err);
            if (err instanceof ApiError) {
                setError(`Erreur ${err.status}: ${err.message}`);
            } else {
                setError('Erreur lors de la suppression du client');
            }
        } finally {
            setIsDeleting(false);
        }
    };

    // Copier le token dans le presse-papiers
    const handleCopyToken = (token: string) => {
        navigator.clipboard.writeText(token)
            .then(() => {
                // Feedback visuel temporaire
                const tokenElement = document.getElementById(`token-${token}`);
                if (tokenElement) {
                    tokenElement.classList.add('bg-green-100');
                    setTimeout(() => {
                        tokenElement.classList.remove('bg-green-100');
                    }, 1000);
                }
            })
            .catch(err => {
                console.error('Error copying token:', err);
            });
    };

    // Fonction pour générer une couleur basée sur le nom du client
    const getClientColor = (clientName: string) => {
        if (!clientName) return 'bg-gray-500';

        const colors = [
            'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
            'bg-red-500', 'bg-purple-500', 'bg-pink-500',
            'bg-indigo-500', 'bg-teal-500', 'bg-orange-500'
        ];

        const sum = clientName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[sum % colors.length];
    };

    // Fonction pour obtenir les initiales du client
    const getClientInitials = (clientName: string) => {
        if (!clientName) return '?';
        return clientName.split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    // Contenu de la sidebar
    const sidebarContent = (
        <>
            {/* Liste des clients */}
            {error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                    {error}
                </div>
            ) : clients.length === 0 ? (
                <div className="text-center">
                    <button
                        onClick={handleOpenCreateModal}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center space-x-3"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="ml-2">Nouveau client</span>
                    </button>
                </div>
            ) : (
                <ul className="space-y-1">
                    {clients.map((client) => (
                        <li key={client.id}>
                            <button
                                onClick={() => setSelectedClient(client)}
                                className={`w-full text-left px-4 py-2 rounded-lg flex items-center space-x-3 ${selectedClient?.id === client.id
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <div className={`flex-shrink-0 h-8 w-8 rounded-md flex items-center justify-center text-white font-bold ${getClientColor(client.name)}`}>
                                    {getClientInitials(client.name)}
                                </div>
                                <span className="ml-2 truncate">{client.name}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {/* Bouton Nouveau client en bas de la liste */}
            {clients.length > 0 && !isLoading && !error && (
                <button
                    onClick={handleOpenCreateModal}
                    className="w-full text-left mt-4 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center space-x-3"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="ml-2">Nouveau client</span>
                </button>
            )}
        </>
    );

    return (
        <Layout
            sidebarContent={sidebarContent}
            sidebarTitle="Clients"
            showSidebar={true}
        >
            <div className="p-6">
                {/* Titre de la page - uniquement affiché quand aucun client n'est sélectionné */}
                {!selectedClient && (
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
                    </div>
                )}

                {/* Contenu */}
                {selectedClient ? (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        {/* En-tête avec image/initiales et actions */}
                        <div className="relative">
                            {/* Arrière-plan avec un dégradé */}
                            <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>

                            {/* Overlay avec un motif subtil pour ajouter de la texture */}
                            <div className="absolute inset-0 bg-opacity-10 bg-pattern"></div>

                            {/* Contenu de l'en-tête */}
                            <div className="absolute inset-0 flex items-center justify-between px-8">
                                <div className="flex items-center">
                                    {/* Avatar du client */}
                                    <div className={`h-16 w-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg border-2 border-white border-opacity-20 ${getClientColor(selectedClient.name)}`}>
                                        {getClientInitials(selectedClient.name)}
                                    </div>

                                    {/* Informations avec une typographie améliorée */}
                                    <div className="ml-5">
                                        <h2 className="text-xl font-bold text-white tracking-tight">{selectedClient.name}</h2>
                                        <div className="flex items-center mt-1">
                                            <span className="text-blue-100 text-md">ID: {selectedClient.id}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Boutons d'action */}
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => handleOpenEditModal(selectedClient)}
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
                                        onClick={() => handleDeleteClient(selectedClient)}
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

                        {/* Informations principales */}
                        <div className="px-6 py-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Détails du client</h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <dl className="space-y-4">
                                            <div className="flex justify-between">
                                                <dt className="text-sm font-medium text-gray-500">Identifiant</dt>
                                                <dd className="text-sm text-gray-900">{selectedClient.id}</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-sm font-medium text-gray-500">Dernière utilisation</dt>
                                                <dd className="text-sm text-gray-900">
                                                    {selectedClient.lastUsed ? new Date(selectedClient.lastUsed).toLocaleString() : 'Jamais utilisé'}
                                                </dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-sm font-medium text-gray-500">Statut</dt>
                                                <dd className="text-sm text-gray-900">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Actif
                                                    </span>
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Token d'accès</h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="bg-white border border-gray-200 rounded px-3 py-2 font-mono text-sm text-gray-800 flex-1 overflow-x-auto">
                                                {selectedClient.token}
                                            </div>
                                            <button
                                                onClick={() => handleCopyToken(selectedClient.token)}
                                                className="ml-2 inline-flex items-center p-2 border border-transparent rounded-md text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                title="Copier le token"
                                            >
                                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Ce token est utilisé pour authentifier les requêtes du client à l'API Gotify.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun client sélectionné</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Sélectionnez un client dans la liste ou créez-en un nouveau.
                        </p>
                        <div className="mt-4">
                            <button
                                onClick={handleOpenCreateModal}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Nouveau client
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de création/édition de client */}
            {isModalOpen && (
                <div className="fixed z-10 inset-0 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            {modalMode === 'create' ? 'Créer un nouveau client' : 'Modifier le client'}
                                        </h3>
                                        <div className="mt-4">
                                            <label htmlFor="client-name" className="block text-sm font-medium text-gray-700">
                                                Nom du client
                                            </label>
                                            <input
                                                type="text"
                                                id="client-name"
                                                value={clientName}
                                                onChange={(e) => setClientName(e.target.value)}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                placeholder="Entrez le nom du client"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    onClick={handleSaveClient}
                                    disabled={isProcessing || !clientName.trim()}
                                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm ${isProcessing || !clientName.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isProcessing ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Traitement...
                                        </>
                                    ) : (
                                        modalMode === 'create' ? 'Créer' : 'Enregistrer'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    disabled={isProcessing}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Annuler
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmation de suppression */}
            <ConfirmModal
                isOpen={isConfirmModalOpen}
                onClose={() => {
                    setIsConfirmModalOpen(false);
                    setClientToDelete(null);
                }}
                onConfirm={confirmDeleteClient}
                title="Supprimer le client"
                message={`Êtes-vous sûr de vouloir supprimer le client "${clientToDelete?.name}" ? Cette action est irréversible.`}
                confirmText="Supprimer"
                cancelText="Annuler"
                isLoading={isDeleting}
                type="danger"
            />
        </Layout>
    );
};

export default Clients; 
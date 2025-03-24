import { useState, useEffect } from 'react';
import { Client, clientService } from '../services/clients';
import { ApiError } from '../services/api';
import ConfirmModal from '../components/modals/Confirm';
import Layout from '../components/layout/Layout';
import ClientModal from '../components/modals/Client';
import { useTranslation } from '../i18n';

const Clients = () => {
    // States
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [clientName, setClientName] = useState('');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // Loading and error states
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { t } = useTranslation();

    // Load clients on component mount
    useEffect(() => {
        fetchClients();
    }, []);

    /**
     * Generate a consistent color based on client name
     */
    const getClientColor = (clientName: string): string => {
        if (!clientName) return 'bg-gray-500';

        const colors = [
            'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
            'bg-red-500', 'bg-purple-500', 'bg-pink-500',
            'bg-indigo-500', 'bg-teal-500', 'bg-orange-500'
        ];

        const sum = clientName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[sum % colors.length];
    };

    /**
     * Get client initials for avatar
     */
    const getClientInitials = (clientName: string): string => {
        if (!clientName) return '?';
        return clientName.split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    /**
     * Fetch clients
     */
    const fetchClients = async (): Promise<void> => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedClients = await clientService.getClients();
            setClients(fetchedClients);
            if (fetchedClients.length > 0 && !selectedClient) {
                setSelectedClient(fetchedClients[0]);
            }
        } catch (err) {
            const errorMessage = err instanceof ApiError
                ? t('common.errors', { status: err.status, message: err.message })
                : t('clients.errors.loadingClientsFailed');
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Open the client creation modal
     */
    const handleOpenCreateModal = (): void => {
        setModalMode('create');
        setClientName('');
        setIsModalOpen(true);
    };

    /**
     * Open the client edit modal
     */
    const handleOpenEditModal = (client: Client): void => {
        setModalMode('edit');
        setClientName(client.name);
        setSelectedClient(client);
        setIsModalOpen(true);
    };

    /**
     * Close the client modal
     */
    const handleCloseModal = (): void => {
        setIsModalOpen(false);
        setClientName('');
    };

    /**
     * Save a client (creation or modification)
     */
    const handleSaveClient = async (): Promise<void> => {
        if (!clientName.trim()) return;

        setIsProcessing(true);
        setError(null);
        try {
            let updatedClient: Client;

            if (modalMode === 'create') {
                updatedClient = await clientService.createClient(clientName);
                setClients([...clients, updatedClient]);
                setSelectedClient(updatedClient);
            } else if (selectedClient) {
                updatedClient = await clientService.updateClient(selectedClient.id, clientName);
                setClients(clients.map(client =>
                    client.id === updatedClient.id ? updatedClient : client
                ));
                setSelectedClient(updatedClient);
            }

            handleCloseModal();
        } catch (err) {
            const errorMessage = err instanceof ApiError
                ? t('common.errors', { status: err.status, message: err.message })
                : t('clients.errors.savingClientFailed');
            setError(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    /**
     * Prepare client deletion
     */
    const handleDeleteClient = (client: Client): void => {
        setClientToDelete(client);
        setIsConfirmModalOpen(true);
    };

    /**
     * Confirm and execute client deletion
     */
    const confirmDeleteClient = async (): Promise<void> => {
        if (!clientToDelete) return;

        setIsDeleting(true);
        setError(null);
        try {
            await clientService.deleteClient(clientToDelete.id);

            // Update client list
            const updatedClients = clients.filter(client => client.id !== clientToDelete.id);
            setClients(updatedClients);

            // Handle selected client after deletion
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
            const errorMessage = err instanceof ApiError
                ? t('common.errors', { status: err.status, message: err.message })
                : t('clients.errors.deletingClientFailed');
            setError(errorMessage);
        } finally {
            setIsDeleting(false);
        }
    };

    /**
     * Copy the token to the clipboard
     */
    const handleCopyToken = (token: string): void => {
        navigator.clipboard.writeText(token)
            .then(() => {
                const tokenElement = document.getElementById(`token-${token}`);
                if (tokenElement) {
                    tokenElement.classList.add('bg-green-100');
                    setTimeout(() => {
                        tokenElement.classList.remove('bg-green-100');
                    }, 1000);
                }
            })
            .catch(err => {
                console.error(t('clients.errors.copyingTokenFailed') + ': ' + err);
            });
    };

    // Sidebar content with the clients list
    const sidebarContent = (
        <>
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
                        <span className="ml-2">{t('clients.actions.newClient')}</span>
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

            {/* Button to create a new client at the bottom of the list */}
            {clients.length > 0 && !isLoading && !error && (
                <button
                    onClick={handleOpenCreateModal}
                    className="w-full text-left mt-4 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center space-x-3"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="ml-2">{t('clients.actions.newClient')}</span>
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
                {/* Page title - displayed only when no client is selected */}
                {!selectedClient && (
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">{t('clients.title')}</h1>
                    </div>
                )}

                {/* Content */}
                {selectedClient ? (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        {/* Header with gradient background */}
                        <div className="relative">
                            <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
                            <div className="absolute inset-0 bg-opacity-10 bg-pattern"></div>

                            {/* Header content */}
                            <div className="absolute inset-0 flex items-center justify-between px-8">
                                <div className="flex items-center">
                                    {/* Client avatar */}
                                    <div className={`h-16 w-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg border-2 border-white border-opacity-20 ${getClientColor(selectedClient.name)}`}>
                                        {getClientInitials(selectedClient.name)}
                                    </div>

                                    {/* Client information */}
                                    <div className="ml-5">
                                        <h2 className="text-xl font-bold text-white tracking-tight">{selectedClient.name}</h2>
                                        <div className="flex items-center mt-1">
                                            <span className="text-blue-100 text-md">ID: {selectedClient.id}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => handleOpenEditModal(selectedClient)}
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
                                        onClick={() => handleDeleteClient(selectedClient)}
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Détails du client</h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <dl className="space-y-4">
                                            <div className="flex justify-between">
                                                <dt className="text-sm font-medium text-gray-500">{t('clients.details.identifier')}</dt>
                                                <dd className="text-sm text-gray-900">{selectedClient.id}</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-sm font-medium text-gray-500">{t('clients.details.lastUsed')}</dt>
                                                <dd className="text-sm text-gray-900">
                                                    {selectedClient.lastUsed ? new Date(selectedClient.lastUsed).toLocaleString() : t('clients.details.neverUsed')}
                                                </dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-sm font-medium text-gray-500">{t('clients.details.status')}</dt>
                                                <dd className="text-sm text-gray-900">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        {t('clients.details.active')}
                                                    </span>
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">{t('clients.details.authToken')}</h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center mb-2">
                                            <div id={`token-${selectedClient.token}`} className="bg-white border border-gray-200 rounded px-3 py-2 font-mono text-sm text-gray-800 flex-1 overflow-x-auto">
                                                {selectedClient.token}
                                            </div>
                                            <button
                                                onClick={() => handleCopyToken(selectedClient.token)}
                                                className="ml-2 inline-flex items-center p-2 border border-transparent rounded-md text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                title={t('clients.actions.copyToken')}
                                            >
                                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {t('clients.details.tokenDescription')}
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
                        <h3 className="mt-2 text-sm font-medium text-gray-900">{t('clients.noClientsSelected')}</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {t('clients.noClientsSelectedDescription')}
                        </p>
                        <div className="mt-4">
                            <button
                                onClick={handleOpenCreateModal}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                {t('clients.actions.newClient')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Client modal */}
            <ClientModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveClient}
                modalMode={modalMode}
                clientName={clientName}
                setClientName={setClientName}
                isProcessing={isProcessing}
            />

            {/* Confirmation modal for client deletion */}
            <ConfirmModal
                isOpen={isConfirmModalOpen}
                onClose={() => {
                    setIsConfirmModalOpen(false);
                    setClientToDelete(null);
                }}
                onConfirm={confirmDeleteClient}
                title={t('clients.modals.deleteClient.title')}
                message={t('clients.modals.deleteClient.message', { name: clientToDelete?.name })}
                confirmText={t('actions.delete')}
                cancelText={t('actions.cancel')}
                isLoading={isDeleting}
                type="danger"
            />
        </Layout>
    );
};

export default Clients; 
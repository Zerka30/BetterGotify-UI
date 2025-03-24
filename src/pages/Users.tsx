import React, { useState, useEffect } from 'react';
import { User, userService } from '../services/users';
import { ApiError } from '../services/api';
import Layout from '../components/layout/Layout';
import ConfirmModal from '../components/modals/Confirm';
import UserModal from '../components/modals/User';

const Users: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [userModalMode, setUserModalMode] = useState<'create' | 'edit'>('create');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = async (): Promise<void> => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedUsers = await userService.getUsers();
            setUsers(fetchedUsers);
        } catch (err) {
            console.error('Error fetching users:', err);
            if (err instanceof ApiError) {
                setError(`Erreur ${err.status}: ${err.message}`);
            } else {
                setError('Erreur lors du chargement des utilisateurs');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpenCreateModal = (): void => {
        setUserModalMode('create');
        setSelectedUser(null);
        setIsUserModalOpen(true);
    };

    const handleOpenEditModal = (user: User): void => {
        setUserModalMode('edit');
        setSelectedUser(user);
        setIsUserModalOpen(true);
    };

    const handleDeleteUser = (user: User): void => {
        setUserToDelete(user);
        setIsConfirmModalOpen(true);
    };

    const confirmDeleteUser = async (): Promise<void> => {
        if (!userToDelete) return;

        setIsDeleting(true);
        try {
            await userService.deleteUser(userToDelete.id);
            setUsers(users.filter(u => u.id !== userToDelete.id));
            setIsConfirmModalOpen(false);
            setUserToDelete(null);
        } catch (err) {
            console.error('Error deleting user:', err);
            if (err instanceof ApiError) {
                setError(`Erreur ${err.status}: ${err.message}`);
            } else {
                setError('Erreur lors de la suppression de l\'utilisateur');
            }
        } finally {
            setIsDeleting(false);
        }
    };

    const getUserInitials = (name: string): string => {
        if (!name) return '?';
        return name.split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const getUserColor = (username: string): string => {
        if (!username) return 'bg-gray-500';

        const colors = [
            'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
            'bg-red-500', 'bg-purple-500', 'bg-pink-500',
            'bg-indigo-500', 'bg-teal-500', 'bg-orange-500'
        ];

        const sum = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[sum % colors.length];
    };

    return (
        <Layout
            sidebarContent={
                <>
                    <button
                        onClick={handleOpenCreateModal}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center space-x-3"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="ml-2">Nouvel utilisateur</span>
                    </button>
                </>
            }
            sidebarTitle="Utilisateurs"
            showSidebar={true}
        >
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
                    <button
                        onClick={handleOpenCreateModal}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Nouvel utilisateur
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    {isLoading ? (
                        <div className="p-6 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                            Aucun utilisateur trouvé
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                            {users.map(user => (
                                <li key={user.id}>
                                    <div className="px-6 py-4 flex items-center">
                                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white font-medium ${getUserColor(user.name)}`}>
                                            {getUserInitials(user.name)}
                                        </div>
                                        <div className="ml-4 flex-1">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-lg font-medium text-gray-900">
                                                        {user.name}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.admin
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : 'bg-green-100 text-green-800'
                                                        }`}>
                                                        {user.admin ? 'Administrateur' : 'Utilisateur'}
                                                    </span>
                                                    <button
                                                        onClick={() => handleOpenEditModal(user)}
                                                        className="text-gray-400 hover:text-blue-500 focus:outline-none"
                                                        title="Modifier"
                                                    >
                                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user)}
                                                        className="text-gray-400 hover:text-red-500 focus:outline-none"
                                                        title="Supprimer"
                                                        disabled={isDeleting}
                                                    >
                                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <UserModal
                    isOpen={isUserModalOpen}
                    onClose={() => setIsUserModalOpen(false)}
                    onSuccess={fetchUsers}
                    mode={userModalMode}
                    user={selectedUser}
                />

                <ConfirmModal
                    isOpen={isConfirmModalOpen}
                    onClose={() => {
                        setIsConfirmModalOpen(false);
                        setUserToDelete(null);
                    }}
                    onConfirm={confirmDeleteUser}
                    title="Supprimer l'utilisateur"
                    message={`Êtes-vous sûr de vouloir supprimer l'utilisateur "${userToDelete?.name}" ? Cette action est irréversible.`}
                    confirmText="Supprimer"
                    cancelText="Annuler"
                    isLoading={isDeleting}
                    type="danger"
                />
            </div>
        </Layout>
    );
};

export default Users; 
import React, { useState, useEffect } from 'react';
import { User, userService } from '../../services/users';
import { useTranslation } from 'react-i18next';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    mode: 'create' | 'edit';
    user?: User | null;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSuccess, mode, user }) => {
    // Form states
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);

    // UI states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Translation
    const { t } = useTranslation();

    // Reset form when modal opens or mode changes
    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && user) {
                setName(user.name || '');
                setIsAdmin(user.admin || false);
                // Reset password fields when editing
                setPassword('');
                setConfirmPassword('');
            } else {
                // Reset all fields for create mode
                setName('');
                setPassword('');
                setConfirmPassword('');
                setIsAdmin(false);
            }
            // Clear any previous errors
            setError(null);
        }
    }, [isOpen, mode, user]);

    const validateForm = (): boolean => {
        // Basic validation
        if (!name.trim()) {
            setError(t('users.errors.name'));
            return false;
        }

        if (mode === 'create') {
            if (!password.trim()) {
                setError(t('users.errors.password'));
                return false;
            } a

            if (password !== confirmPassword) {
                setError(t('users.errors.passwordMismatch'));
                return false;
            }
        } else if (password && password !== confirmPassword) {
            setError(t('users.errors.passwordMismatch'));
            return false;
        }

        return true;
    };

    const handleSubmit = async (): Promise<void> => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            if (mode === 'create') {
                await userService.createUser({
                    name,
                    pass: password,
                    admin: isAdmin
                });
            } else if (mode === 'edit' && user) {
                const updateData: any = {
                    name,
                    admin: isAdmin
                };

                // Only include password if it was changed
                if (password.trim()) {
                    updateData.pass = password;
                }

                await userService.updateUser(user.id, updateData);
            }

            // Call success callback and close modal
            onSuccess();
            onClose();
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message || t('errors.user.errorCreating'));
            } else {
                setError(t('errors.user.errorCreating'));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Don't render anything if modal is closed
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 overflow-y-auto z-50">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-4 text-center">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-middle bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all w-full sm:max-w-lg mx-auto">
                    {/* Header avec titre et bouton de fermeture */}
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                {mode === 'create' ? t('users.modals.createUser.title') : t('users.modals.updateUser.title')}
                            </h3>
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                            >
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Username field */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    {t('users.modals.form.username')}
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* Password fields - only shown in create mode or optionally in edit mode */}
                            {mode === 'create' ? (
                                <>
                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                            {t('users.modals.form.password')}
                                        </label>
                                        <input
                                            type="password"
                                            id="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                            {t('users.modals.form.confirmPassword')}
                                        </label>
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                            {t('users.modals.form.newPassword')}
                                        </label>
                                        <input
                                            type="password"
                                            id="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            disabled={isSubmitting}
                                            placeholder={t('users.details.passwordPlaceholder')}
                                        />
                                    </div>

                                    {password && (
                                        <div>
                                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                                {t('users.modals.form.confirmNewPassword')}
                                            </label>
                                            <input
                                                type="password"
                                                id="confirmPassword"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Admin checkbox */}
                            <div className="flex items-center">
                                <input
                                    id="isAdmin"
                                    type="checkbox"
                                    checked={isAdmin}
                                    onChange={(e) => setIsAdmin(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    disabled={isSubmitting}
                                />
                                <label htmlFor="isAdmin" className="ml-2 block text-sm text-gray-900">
                                    {t('users.details.role.admin')}
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Footer avec boutons */}
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                        >
                            {t('actions.cancel')}
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm disabled:opacity-50"
                        >
                            {isSubmitting ? t('actions.saving') : mode === 'create' ? t('actions.create') : t('actions.update')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserModal;
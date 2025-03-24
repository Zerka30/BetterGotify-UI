import React from 'react';
import { useTranslation } from '../../i18n';

interface ClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    clientName: string;
    setClientName: (name: string) => void;
    modalMode: 'create' | 'edit';
    isProcessing: boolean;
}

const ClientModal: React.FC<ClientModalProps> = ({
    isOpen,
    onClose,
    onSave,
    clientName,
    setClientName,
    modalMode,
    isProcessing
}) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="fixed z-[100] inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <div className="relative inline-block align-middle bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    {modalMode === 'create' ? t('clients.modals.createClient.title') : t('clients.modals.updateClient.title')}
                                </h3>
                                <div className="mt-4">
                                    <label htmlFor="client-name" className="block text-sm font-medium text-gray-700 text-left">
                                        {t('clients.modals.form.name')}
                                    </label>
                                    <input
                                        type="text"
                                        id="client-name"
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder={t('clients.modals.form.namePlaceholder')}
                                        autoFocus
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            onClick={onSave}
                            disabled={isProcessing || !clientName.trim()}
                            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm ${isProcessing || !clientName.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isProcessing ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {t('clients.modals.form.processing')}
                                </>
                            ) : (
                                modalMode === 'create' ? t('actions.create') : t('actions.save')
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isProcessing}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            {t('actions.cancel')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientModal; 
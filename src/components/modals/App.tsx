import React, { useState, useEffect } from 'react';
import { Application } from '../../services/applications';

interface AppModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (app: Application, image?: File, deleteImage?: boolean) => void;
    mode: 'create' | 'edit';
    app: Application | null;
}

const AppModal: React.FC<AppModalProps> = ({ isOpen, onClose, onSave, mode, app }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [deleteCurrentImage, setDeleteCurrentImage] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const getImageUrl = (imagePath: string | undefined) => {
        if (!imagePath) return null;
        if (imagePath === 'static/defaultapp.png') return null;
        if (imagePath.startsWith('http') || imagePath.startsWith('data:')) return imagePath;
        return `https://gotify.zerka.dev/${imagePath}`;
    };

    const hasValidImage = (app: Application | null) => {
        return app?.image && app.image !== 'static/defaultapp.png';
    };

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && app) {
                setName(app.name || '');
                setDescription(app.description || '');
                setImage(null);
                setDeleteCurrentImage(false);
                setImagePreview(hasValidImage(app) ? getImageUrl(app.image) : null);
            } else {
                setName('');
                setDescription('');
                setImage(null);
                setDeleteCurrentImage(false);
                setImagePreview(null);
            }
        }
    }, [isOpen, mode, app]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setImage(selectedFile);
            setDeleteCurrentImage(false);

            // Créer un aperçu de l'image
            const reader = new FileReader();
            reader.onload = (event) => {
                setImagePreview(event.target?.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleRemoveImage = () => {
        setImage(null);
        setImagePreview(null);
        if (app?.image) {
            setDeleteCurrentImage(true);
        }
    };

    const handleSubmit = async () => {
        // Validation de base
        if (!name.trim()) {
            setError('Le nom de l\'application est requis');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const appData: Application = {
                id: app?.id || 0,
                name,
                description,
                token: app?.token || '',
                image: app?.image || '',
                internal: app?.internal || false,
                defaultPriority: app?.defaultPriority || 0
            };

            onSave(appData, image || undefined, deleteCurrentImage);
        } catch (err) {
            console.error('Erreur détaillée lors de l\'enregistrement:', err);
            setError('Une erreur est survenue lors de l\'enregistrement de l\'application');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) {
        return null;
    }

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
                                {mode === 'create' ? 'Nouvelle application' : 'Modifier l\'application'}
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

                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Nom *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Image
                                </label>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center">
                                    {(imagePreview || (app?.image && !deleteCurrentImage)) && (
                                        <div className="relative mb-3 sm:mb-0 sm:mr-3">
                                            <img
                                                src={imagePreview || getImageUrl(app?.image) || ''}
                                                alt="Aperçu"
                                                className="h-20 w-20 object-contain rounded-md border border-gray-300"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600 focus:outline-none"
                                            >
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <input
                                            type="file"
                                            id="image"
                                            onChange={handleImageChange}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        <label
                                            htmlFor="image"
                                            className="cursor-pointer py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none text-center flex items-center justify-center"
                                        >
                                            {imagePreview || (app?.image && !deleteCurrentImage) ? 'Changer l\'image' : 'Ajouter une image'}
                                        </label>
                                        <p className="mt-1 text-xs text-gray-500 text-center">
                                            PNG, JPG, GIF jusqu'à 2MB
                                        </p>
                                    </div>
                                </div>
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
                            Annuler
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm disabled:opacity-50"
                        >
                            {isSubmitting ? 'Enregistrement...' : mode === 'create' ? 'Créer' : 'Mettre à jour'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppModal;
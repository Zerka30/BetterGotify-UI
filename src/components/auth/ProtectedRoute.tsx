import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/auth';

interface ProtectedRouteProps {
    children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const [isChecking, setIsChecking] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Vérifie si le token existe
                const token = authService.getToken();

                if (!token) {
                    setIsAuthenticated(false);
                    setIsChecking(false);
                    return;
                }

                // Vérifie si le token est valide (optionnel)
                // Vous pouvez ajouter une requête à l'API pour valider le token
                try {
                    // Exemple: await authService.validateToken();
                    setIsAuthenticated(true);
                } catch (error) {
                    console.error('Token invalide:', error);
                    authService.logout();
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error('Erreur lors de la vérification de l\'authentification: ', error);
                setIsAuthenticated(false);
            } finally {
                setIsChecking(false);
            }
        };

        checkAuth();
    }, []);

    if (isChecking) {
        // Affiche un indicateur de chargement pendant la vérification
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirige vers la page de connexion si non authentifié
        // Sauvegarde l'URL actuelle pour rediriger après connexion
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Affiche le contenu protégé si authentifié
    return <>{children}</>;
};

export default ProtectedRoute; 
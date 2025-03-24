# Étape de build
FROM node:18 as build

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY tsconfig*.json ./
COPY *.config.js vite.config.ts ./

# Installer les dépendances
RUN npm install

# Copier le reste du code source
COPY public/ ./public/
COPY src/ ./src/
COPY index.html ./

# Ajouter cette ligne pour résoudre le problème crypto
ENV NODE_OPTIONS=--openssl-legacy-provider

# Construire l'application
RUN npm run build

# Étape de production avec Nginx
FROM nginx:alpine

# Copier les fichiers de build depuis l'étape précédente
COPY --from=build /app/dist /usr/share/nginx/html

# Copier la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copier le script d'initialisation
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

# Activer les logs de débogage Nginx
RUN sed -i 's/error_log  \/var\/log\/nginx\/error.log notice;/error_log  \/var\/log\/nginx\/error.log debug;/g' /etc/nginx/nginx.conf

# Exposer le port 80
EXPOSE 80

# Utiliser notre script d'entrée personnalisé
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
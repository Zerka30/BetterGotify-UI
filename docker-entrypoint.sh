#!/bin/sh
set -e

# Extraire l'URL Gotify du fichier de configuration
GOTIFY_URL=$(grep -o '"gotify_url": *"[^"]*"' /usr/share/nginx/html/config.json | cut -d'"' -f4)

# Utiliser une valeur par défaut si non trouvée
if [ -z "$GOTIFY_URL" ]; then
  GOTIFY_URL="http://gotify:8080"
  echo "Aucune URL Gotify trouvée dans config.json, utilisation de la valeur par défaut: $GOTIFY_URL"
else
  echo "URL Gotify trouvée dans config.json: $GOTIFY_URL"
fi

# Exporter la variable pour envsubst
export GOTIFY_URL

# Remplacer les variables d'environnement dans les fichiers de configuration Nginx
envsubst '${GOTIFY_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Exécuter la commande originale
exec "$@" 
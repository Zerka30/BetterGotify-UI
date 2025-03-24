export const getAppColor = (appName: string) => {
    const colors = [
        'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
        'bg-red-500', 'bg-purple-500', 'bg-pink-500',
        'bg-indigo-500', 'bg-teal-500', 'bg-orange-500'
    ];

    const sum = appName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[sum % colors.length];
};

export const getAppInitials = (appName: string) => {
    if (!appName) return '?';
    return appName.split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
};

export const getImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return null;
    if (imagePath === 'static/defaultapp.png') return null;
    if (imagePath.startsWith('http')) return imagePath;

    if (imagePath.startsWith('image/')) {
        return `/${imagePath}`;
    }

    return `/image/${imagePath}`;
};

export const hasValidImage = (app: any) => {
    return app?.image && app.image !== 'static/defaultapp.png';
}; 
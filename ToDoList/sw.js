self.addEventListener('install', event => {
    self.skipWaiting(); 
});

self.addEventListener('activate', event => {
    event.waitUntil(clients.claim());
});

self.addEventListener('notificationclick', event => {
    const action = event.action;
    const notification = event.notification;
    const taskId = notification.data.id; 

    if (action === 'open') {
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then(windowClients => {
                for (let client of windowClients) {
                    if (client.url.includes('index.html') && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) return clients.openWindow('index.html');
            })
        );
    } 
    else if (action === 'close') {
        event.waitUntil(
            clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'TASK_COMPLETED',
                        id: taskId
                    });
                });
            })
        );
    }

    notification.close();
});
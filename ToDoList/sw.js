self.addEventListener('install', event => {
    self.skipWaiting(); 
});

self.addEventListener('activate', event => {
    event.waitUntil(clients.claim());
});

self.addEventListener('notificationclick', event => {
    const notification = event.notification;
    const action = event.action;
    const taskId = notification.data.id;

    if (action === 'open') {
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then(clientsList => {
                clientsList.forEach(client => {
                    client.postMessage({
                        type: 'MARK_DONE',
                        id: taskId
                    });
                });
                for (let client of clientsList) {
                    if (client.url.includes('index.html') && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) return clients.openWindow('index.html');
            })
        );
    }
    notification.close();
});

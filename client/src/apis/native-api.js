let window;
let electronAPI;

export function init(_window) {
    window = _window;
    if (!window) {
        console.error('Failed to initialize native API: window is undefined');
        return
    }
    if (window.electronAPI) {
        electronAPI = window.electronAPI;
        console.log('Running in Electron');
    } else {
        console.log('Running in browser');
    }
}
export function subscribeToPlayEvent(callback) {
    if (electronAPI) {
        electronAPI.onMessage((data) => {
            console.log(data);
            if (data === 'play-event') {
                callback(true);
            } else if (data === 'pause-event') {
                callback(false);
            }
        });
    }
}
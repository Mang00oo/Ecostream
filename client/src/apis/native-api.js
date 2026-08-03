import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
let window;
let electronAPI;

let currentPlatform = 'Web';

export function init(_window) {
    window = _window;
    if (!window) {
        console.error('Failed to initialize native API: window is undefined');
        return
    }
    if (window.electronAPI) {
        electronAPI = window.electronAPI;
        currentPlatform = 'Electron';
    } else {
    }
}
export function getPlatform() {
    if (Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android') {
        currentPlatform = "Capacitor";
    }
    return currentPlatform;
}
export async function getDeviceName() {
    if (getPlatform() == 'Capacitor') {
        const info = await Device.getInfo();
        return info.name;
    } else if (getPlatform() == 'Electron') {
        return 'Desktop App'
    }
    return 'Browser';
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
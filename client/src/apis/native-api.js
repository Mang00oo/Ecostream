import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
let electronAPI;

let currentPlatform = 'Web';

export function init(_window) {
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
init(window);

export function getPlatform() {
    if (Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android') {
        currentPlatform = "Capacitor";
    }
    return currentPlatform;
}
export async function getDeviceName() {
    console.log('gettingDeviceName')
    if (getPlatform() == 'Capacitor') {
        const info = await Device.getInfo();
        return info.name;
    } else if (electronAPI) {
        electronAPI.sendMessage({func: 'getDeviceName'})
        return new Promise((resolve, reject) => {
            electronAPI.onMessage((data) => {
                console.log(data);
                if (data.deviceName) {
                    resolve(data.deviceName);
                }
            });
        });
    }
    return 'Browser';
}
export function subscribeToPlayEvent(callback) {
    if (electronAPI) {
        electronAPI.onMessage((data) => {
            if (data === 'toggle-playback') {
                callback();
            }
        });
    }
}
export function updateTouchbar(isPlaying) {
    if (electronAPI) {
        electronAPI.sendMessage({func: 'updatePlayback', isPlaying: isPlaying});
    }   
}
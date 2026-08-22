import axios from 'axios';
import { io } from "socket.io-client";
import toast from 'react-hot-toast';
import { CapacitorHttp } from '@capacitor/core';
import { BackgroundTask } from '@capawesome/capacitor-background-task';
import * as nativeApi from './native-api';

let SERVER_API_URL = localStorage.getItem("serverApiUrl");
export function updateServerUrl() {
    SERVER_API_URL = localStorage.getItem("serverApiUrl");
    isOnline = null;
}

let socket = null;
let currentUserId = 'none';
const isDemo = false;
let isOnline = null;

let latency = 0;
let clockOffset = 0;
function waitForVariable(checkFn, callback, intervalTime = 100) {
  var interval = setInterval(function() {
    if (checkFn()) {
      clearInterval(interval);
      callback();
    }
  }, intervalTime);
}
function getSocket() {
    if (!socket) {
        socket = io(SERVER_API_URL, {
            autoConnect: false,
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: Infinity,
            timeout: 10000,
        });
        socket.on('connect', () => {
            waitForVariable(
                function() { return currentUserId !== 'none'; }, 
                function() {
                    console.log('getting Device name');
                    nativeApi.getDeviceName().then(name => {
                        socket.emit('setUser', {userID: currentUserId, deviceName: name, deviceType: nativeApi.getPlatform()});
                    })
                }
            );
        });
        
        socket.on('connect_error', (error) => {
            console.warn('Socket connect_error', error);
        });
        socket.on('error', (error) => {
            console.warn('Socket error', error);
        });
    }
    return socket;
}

function connectSocket() {
    const sock = getSocket();
    if (isOnline && !sock.connected && !sock.connecting) {
        sock.connect();
    }
    return sock;
}

setInterval(()=> {
    const t0 = Date.now();
    const sock = getSocket();
    if (!sock || !sock.connected) {
        return;
    }
    sock.emit('ntp_ping', {}, (serverTimestamps)=>{
        const t3 = Date.now();
        const {t1, t2} = serverTimestamps;
        const networkRoundTrip = (t3 - t0) - (t2 - t1);
        const oneWayLatency = networkRoundTrip / 2;
        const currentOffset = ((t1 - t0) + (t2 - t3)) / 2;
        if (clockOffset == 0) {
            clockOffset = currentOffset;
        } else {
            clockOffset = (clockOffset * 0.9) + (currentOffset * 0.1);
        }
        latency = oneWayLatency / 1000;
    });
}, 1000);
export function setPlaybackOnAllClients(isPlaying, seekTime) {
    const sock = getSocket();
    if (sock && sock.connected) {
        sock.emit('togglePlay', { isPlaying: isPlaying, seekTime: seekTime + latency + 0.05, userID: currentUserId });
    }
}
export function updateSongOnAllClients(song) {
    const sock = getSocket();
    if (sock && sock.connected) {
        sock.emit('updateSong', song);
    }
}
export function toggleDevicePlayback(id, isPlaying) {
    const sock = getSocket();
    if (sock && sock.connected) {
        sock.emit('setDevicePlaying', {id: id, isPlaying: isPlaying});
    }
}
export function subscribeToUpdateSongEvent(callback) {
    const sock = getSocket();
    sock.on('updateSong', (song)=> {
        callback(song);
    });
}
export function subscribeToPlayEvent(callback) {
    const sock = getSocket();
    sock.on('togglePlay', async (data) => {
        if (data.userID == currentUserId) {
            if (nativeApi.getPlatform() == "Capacitor") {
                if (!data.isPlaying) {
                    let taskId = await BackgroundTask.beforeExit(async () => {
                        await callback(data.isPlaying, data.seekTime + latency);
                    });
                } else {
                    await callback(data.isPlaying, data.seekTime + latency);
                }
            } else {
                await callback(data.isPlaying, data.seekTime + latency);
                console.log(latency);
            }
            
        }
    });
}
export function subscribeToDevicePlaybackEvent(callback) {
    const sock = getSocket();
    sock.on('setDevicePlayback', async (data) => {
        await callback(data);
    });
}
export function subscribeToDeviceListUpdateEvent(callback) {
    const sock = getSocket();
    sock.on('updateDeviceList', async (data) => {
        await callback(data);
    });
}
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }
  return config;
}, error => {
  return Promise.reject(error);
});
let isLoggingIn = false;
export async function checkLogin() {
    if (isLoggingIn) return false;
    isLoggingIn = true;
    if (localStorage.getItem('token')) {
        const params = { token: localStorage.getItem('token') };
        const response = await axios.get(SERVER_API_URL + 'auth/login', { params: params });
        if (response.data.success) {
            console.log(response.data.userID);
            localStorage.setItem('token', response.data.token);
            currentUserId = response.data.userID;
            isLoggingIn = false;
            return {success: true, userID: response.data.userID};
        } else {
            isLoggingIn = false;
            localStorage.removeItem('token');
            return false;
        }
    } else {
        isLoggingIn = false;
        return false
    }
}
//localStorage.removeItem('token');
export async function login(password) {
    const params = { password: password };
    const response = await axios.get(SERVER_API_URL + 'auth/login', { params: params });
    if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        return {success: true, userID: response.data.userID};
        currentUserId = response.data.userID;
        if (response.data.userID != 'none') {
            socket.emit('setUser', {userID: currentUserId, deviceName: await nativeApi.getDeviceName(), deviceType: nativeApi.getPlatform()});
        }
    } else {
        localStorage.removeItem('token');
        return false;
    }
}
export async function loginAsUser(_id, pwd) {
    const params = { userID: _id, password: pwd }
    console.log('Params: ');
    console.log(params);
    const response = await axios.get(SERVER_API_URL + 'api/login_as_user', { params: params });
    if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        currentUserId = response.data.userID;
        if (response.data.userID != 'none') {
            socket.emit('setUser', {userID: currentUserId, deviceName: await nativeApi.getDeviceName(), deviceType: nativeApi.getPlatform()});
        }
    }
    return response.data;
}
export async function getUsername() {
    const response = await axios.get(SERVER_API_URL + 'api/get_username');
    return response.data;
}
export async function createUser(username) {
    const response = await axios.get(SERVER_API_URL + 'api/create_user', { params: {username: username} });
    return response.data;
}
export async function renameUser(username) {
    const response = await axios.get(SERVER_API_URL + 'api/rename_user', { params: {username: username} });
    return response.data;
}
export async function deleteUser() {
    const response = await axios.get(SERVER_API_URL + 'api/delete_user');
    return response.data;
}
export async function changePassword(password) {
    const response = await axios.get(SERVER_API_URL + 'api/change_password', { params: {password: password} });
    return response.data;
}
export async function getUsers() {
    const response = await axios.get(SERVER_API_URL + 'api/get_users');
    return response.data;
}
export async function getDevices() {
    const response = await axios.get(SERVER_API_URL + 'api/get_devices');
    return response.data;
}

export async function addStreamedSong(artist, title, artwork) {
    const response = await axios.get(SERVER_API_URL + 'api/add_streamed_song', { params: { artist: artist, title: title, artwork: artwork } });
    return response.data;
}

export async function editPlaylist(name, id) {
    const response = await axios.get(SERVER_API_URL + 'api/edit_playlist', { params: { name: name, id: id } });
    return response.data;
}
export async function deletePlaylist(id) {
    const response = await axios.get(SERVER_API_URL + 'api/delete_playlist', { params: { id: id } });
    return response.data;
}
export async function playlistData(id) {
    const response = await axios.get(SERVER_API_URL + 'api/playlist_data', { params: { id: id } });
    return response.data;
}

export async function controlQueue(action, songId) {
    const params = { action: action };
    if (songId) {
        params.songId = songId;
    }
    const response = await axios.get(SERVER_API_URL + 'api/control_queue', { params: params });
    return response.data;
}
export async function playPlaylist(playlistId, shuffleType) {
    const response = await axios.get(SERVER_API_URL + 'api/play_playlist', { params: { playlistId: playlistId, shuffleType: shuffleType }});
    return response.data;
}
export async function removeFromPlaylist(playlistId, songId) {
    const response = await axios.get(SERVER_API_URL + 'api/remove_from_playlist', { params: { playlistId: playlistId, songId: songId }});
    return response.data;
}
export async function setShuffle(playlistId, shuffleType) {
    const response = await axios.get(SERVER_API_URL + 'api/set_shuffle', { params: { shuffleType: shuffleType, playlistId: playlistId } });
    return response.data;
}
export async function getNowPlaying() {
    const response = await axios.get(SERVER_API_URL + 'api/get_now_playing');
    return response.data;
}
export async function getNextPlaying() {
    const response = await axios.get(SERVER_API_URL + 'api/get_next_playing');
    return response.data;
}
export async function getQueue() {
    const response = await axios.get(SERVER_API_URL + 'api/get_queue' );
    return response.data;
}
export async function addToQueue(songId) {
    const response = await axios.get(SERVER_API_URL + 'api/add_to_queue', {params: {songId: songId}} );
    return response.data;
}
export async function getPosInQueue() {
    const response = await axios.get(SERVER_API_URL + 'api/get_queue_pos' );
    return response.data;
}
export async function getLibrary() {
    const response = await axios.get(SERVER_API_URL + 'api/get_library' );
    return response.data;
}
export async function downloadSong(clickedSong, destinationType, destinationId) {
    let params = { artist: clickedSong.artist, title: clickedSong.title, artworkUrl: clickedSong.artworkPath, albumName: clickedSong.albumName };
    if (destinationType === 'playlist') {
        params.addToPlaylist = destinationId;
    } else if (destinationType === 'queue') {
        params.addToQueue = destinationId;
    }
    const response = axios.get(SERVER_API_URL + 'api/download', { params: params });
    toast.promise( response, {
        loading: 'Adding '+clickedSong.title+' to playlist...',
        success: <b>Added successfully!</b>,
        error: <b>Failed to add song to playlist</b>,
    })
    await response;
    return response.data;
}
export async function addToPlaylist(playlistId, songId) {
    const response = await axios.get(SERVER_API_URL + 'api/add_to_playlist', { params: { playlistId: playlistId, songId: songId } });
    return response.data;
}

export async function getMediaUrl(path) {
    if (isOnline) {
        return SERVER_API_URL + 'media/' + path;
    } else {
        const { getMediaUriFromPath } = await import('./offline');
        return await getMediaUriFromPath(path);
    }
    
}
export function getApiUrl() {
    return SERVER_API_URL + 'api/'
}
export async function getIsOnline() {
    if (isDemo) {
        isOnline = true;
        return true;
    }
    if (isOnline != null) return isOnline;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        isOnline = false;
        return false;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    try {
        const serverUrl = new URL('network_test', SERVER_API_URL.endsWith('/') ? SERVER_API_URL : `${SERVER_API_URL}/`);
        const response = await fetch(serverUrl, {
            method: 'GET',
            signal: controller.signal,
            cache: 'no-store',
        });
        clearTimeout(timeoutId);
        const responseBody = await response.text();
        if (response.ok && responseBody === 'Hello from Ecostream!') {
            isOnline = true;
            connectSocket();
            return true;
        }
    } catch (error) {
        isOnline = false;
        return false;
    } finally {
        clearTimeout(timeoutId);
    }
    isOnline = false;
    return false;
}
export async function getImageUrl(image, setter) {
    if (!image) {return 'no image';}
    if (image.startsWith('https://') || image.startsWith('http://')) {
        setter(image);
    } else {
        if (isOnline) {
            setter(SERVER_API_URL + 'media/' + image);
        } else {
            const { getMediaUriFromPath } = await import('./offline');
            setter(await getMediaUriFromPath(image));
        }
    }
}
import axios from 'axios';
import { io } from "socket.io-client";
import toast from 'react-hot-toast';
import { CapacitorHttp } from '@capacitor/core';
import { BackgroundTask } from '@capawesome/capacitor-background-task';
import * as nativeApi from './native-api';
axios.defaults.adapter = 'fetch'; 

const SERVER_API_URL = 'http://100.90.153.39:8080/';

const socket = io(SERVER_API_URL);

let currentUserId = 'none';

let latency = 0;
let clockOffset = 0;
setInterval(()=> {
    const t0 = Date.now();
    socket.emit('ntp_ping', {}, (serverTimestamps)=>{
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
    socket.emit('togglePlay', { isPlaying: isPlaying, seekTime: seekTime + latency + 0.05, userID: currentUserId });
}
export function updateSongOnAllClients(song) {
    socket.emit('updateSong', song);
}
export function toggleDevicePlayback(id, isPlaying) {
    socket.emit('setDevicePlaying', {id: id, isPlaying: isPlaying});
}
export function subscribeToUpdateSongEvent(callback) {
    socket.on('updateSong', (song)=> {
        callback(song);
    })
}
export function subscribeToPlayEvent(callback) {
    socket.on('togglePlay', async (data) => {
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
    socket.on('setDevicePlayback', async (data) => {
        await callback(data);
    });
}
export function subscribeToDeviceListUpdateEvent(callback) {
    socket.on('updateDeviceList', async (data) => {
        await callback(data);
    });
}
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
            if (response.data.userID != 'none') {
                socket.emit('setUser', {userID: currentUserId, deviceName: await nativeApi.getDeviceName(), deviceType: nativeApi.getPlatform()});
            }
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
export async function setShuffle(shuffleType) {
    const response = await axios.get(SERVER_API_URL + 'api/set_shuffle', { params: { shuffleType: shuffleType } });
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

export function getMediaUrl() {
    return SERVER_API_URL + 'media/';
}
export function getImageUrl(image) {
    if (!image) {return 'no image';}
    if (image.startsWith('https://') || image.startsWith('http://')) {
        return image;
    } else {
        return SERVER_API_URL + 'media/' + image;
    }
}
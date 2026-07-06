import axios from 'axios';
import { io } from "socket.io-client";
import toast from 'react-hot-toast';
import { CapacitorHttp } from '@capacitor/core';
axios.defaults.adapter = 'fetch'; 

const SERVER_API_URL = 'http://100.90.153.39:8080/';

const socket = io(SERVER_API_URL);

let latency = 50;
export function startPlayingOnAllClients() {
    socket.emit('getLatency', Date.now());
    socket.on('getLatency', (data) => {
        latency = data.latency;
        console.log('Latency: ' + latency);
    });
    socket.emit('togglePlay', { isPlaying: true });
}
export function stopPlayingOnAllClients() {
    socket.emit('togglePlay', { isPlaying: false });
}
export function subscribeToPlayEvent(callback) {
    socket.on('togglePlay', async (data) => {
        await callback(data.isPlaying);
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
export async function checkLogin() {
    if (localStorage.getItem('token')) {
        const params = { token: localStorage.getItem('token') };
        const response = await axios.get(SERVER_API_URL + 'auth/login', { params: params });
        if (response.data.success) {
            console.log(response.data.userID);
            localStorage.setItem('token', response.data.token);
            return {success: true, userID: response.data.userID};
        } else {
            localStorage.removeItem('token');
            return false;
        }
    } else {
        return false
    }
}
export async function login(password) {
    const params = { password: password };
    const response = await axios.get(SERVER_API_URL + 'auth/login', { params: params });
    if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        return {success: true, userID: response.data.userID};
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
    }
    return response.data;
}
export async function getUsers() {
    const response = await axios.get(SERVER_API_URL + 'api/get_users');
    return response.data;
}

export async function addStreamedSong(artist, title, artwork) {
    const response = await axios.get(SERVER_API_URL + 'api/add_streamed_song', { params: { artist: artist, title: title, artwork: artwork } });
    return response.data;
}

export async function createPlaylist(name) {
    const response = await axios.get(SERVER_API_URL + 'api/create_playlist', { params: { name: name } });
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
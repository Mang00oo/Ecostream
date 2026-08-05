import { FileTransfer } from '@capacitor/file-transfer';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import * as serverApi from './server-api';
import * as nativeApi from './native-api';
import { Capacitor } from '@capacitor/core';

async function downloadArtwork(artworkPath) {
    try {
        await Filesystem.stat({
            path: 'music/' + artworkPath,
            directory: Directory.LibraryNoCloud,
        });
        return true;
    } catch (e) {
        const fileInfo = await Filesystem.getUri({
            directory: Directory.LibraryNoCloud,
            path: 'music/' + artworkPath
        });
        try {
            await FileTransfer.downloadFile({
                url: await serverApi.getMediaUrl(artworkPath),
                path: fileInfo.uri,
                progress: true
            });
            return true;
        } catch(error) {
            console.log(error);
            return false;
        }
    }
}
async function downloadSongFile(songPath) {
    try {
        await Filesystem.stat({
            path: 'music/' + songPath,
            directory: Directory.LibraryNoCloud,
        });
        return true;
    } catch (e) {
        const fileInfo = await Filesystem.getUri({
            directory: Directory.LibraryNoCloud,
            path: 'music/' + songPath,
        });
        try {
            await FileTransfer.downloadFile({
                url: await serverApi.getMediaUrl(songPath),
                path: fileInfo.uri,
                progress: true,
            });
            return true
        } catch(error) {
            console.log(error);
            return false;
        }
    }
}

async function downloadSong(song) {
    await downloadSongFile(song.songPath);
    await downloadArtwork(song.artworkPath);
}

export async function checkForUpdates() {
    try {
        const playlists = await Filesystem.readdir({
            path: 'playlists',
            directory: Directory.LibraryNoCloud
        });
        for (const playlist of playlists.files) {
            const contents = JSON.parse(await Filesystem.readFile({
                path: playlist.uri,
                encoding: Encoding.UTF8,
            }));
            const serverInfo = await serverApi.playlistData(contents._id)
            if (serverInfo.__v > JSON.parse(contents.data).__v)
            {
                downloadPlaylist(serverInfo._id);
            }
        }
    } catch(error) {
        console.log(error);
    }
    
}

export async function downloadPlaylist(id) {
    const data = await serverApi.playlistData(id);
    const stringData = JSON.stringify(data);
    await Filesystem.writeFile({
        path: 'playlists/'+id+'.txt',
        data: stringData,
        directory: Directory.LibraryNoCloud,
        encoding: Encoding.UTF8,
        recursive: true,
    });
    await downloadArtwork(data.artworkPath);
    for (const song of data.songs) {
        await downloadSong(song);
    }
    return true;
}
export async function getMediaUriFromPath(path) {
    const fileInfo = await Filesystem.getUri({
        directory: Directory.LibraryNoCloud,
        path: 'music/' + path
    });
    return Capacitor.convertFileSrc(fileInfo.uri);
}
export async function getLibrary() {
    var playlistArr = [];
    try {
        const playlists = await Filesystem.readdir({
            path: 'playlists',
            directory: Directory.LibraryNoCloud
        });
        for (const playlist of playlists.files) {
            const contents = await Filesystem.readFile({
                path: playlist.uri,
                encoding: Encoding.UTF8,
            });
            playlistArr.push(JSON.parse(contents.data));
        }
        console.log(playlistArr);
        console.log(playlistArr[0].name);
        return playlistArr;
    } catch (error) {
        return false;
    }
}
export async function initializeOfflineUpdates() {
    try {
        if (nativeApi.getPlatform() == 'Capacitor' && await serverApi.getIsOnline()) {
            await checkForUpdates();
        }
    } catch (error) {
        console.error(error);
    }
}
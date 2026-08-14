import { FileTransfer } from '@capacitor/file-transfer';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import * as serverApi from './server-api';
import * as nativeApi from './native-api';
import { Capacitor } from '@capacitor/core';

export async function isDownloaded(filePath) {
    try {
        await Filesystem.stat({
            path: 'music/' + filePath,
            directory: Directory.LibraryNoCloud,
        });
        return true;
    } catch (e) {
        return false;
    }
}
async function downloadArtwork(artworkPath) {
    if (await isDownloaded(artworkPath)) return true;
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
async function downloadSongFile(songPath) {
    if (await isDownloaded(songPath)) return true;
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
    localStorage.setItem("dl_" + id, true);
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
    localStorage.removeItem("dl_"+id);
    return true;
}
export async function deletePlaylist(id) {
    const data = await getPlaylistData(id);
    if (!data) return;
    var filesToDelete = []
    for (const song of data.songs) {
        filesToDelete.push(song.songPath);
        filesToDelete.push(song.artworkPath)
    }
    for (const playlist of await getLibrary()) {
        if (playlist._id === id) continue;
        for (const song of playlist.songs) {
            const index = filesToDelete.indexOf(song.songPath);

            if (index > -1) {
                filesToDelete.splice(index, 1); 
            }
            const index2 = filesToDelete.indexOf(song.artworkPath);

            if (index2 > -1) {
                filesToDelete.splice(index2, 1); 
            }
        }
    }
    for (const file of filesToDelete) {
        Filesystem.deleteFile({
            path: 'music/'+file,
            directory: Directory.LibraryNoCloud
        });
    }
    Filesystem.deleteFile({
        path: 'playlists/'+id+'.txt',
        directory: Directory.LibraryNoCloud
    });
    return true;
}
export async function getMediaUriFromPath(path) {
    const fileInfo = await Filesystem.getUri({
        directory: Directory.LibraryNoCloud,
        path: 'music/' + path
    });
    return Capacitor.convertFileSrc(fileInfo.uri);
}

export async function getImageBase64FromPath(path) {
    const fileInfo = await Filesystem.readFile({
        directory: Directory.LibraryNoCloud,
        path: 'music/' + path
    });

    const ext = path.split('.').pop()?.toLowerCase();
    let mime = 'image/jpeg';
    if (ext === 'png') mime = 'image/png';
    else if (ext === 'webp') mime = 'image/webp';
    else if (ext === 'gif') mime = 'image/gif';

    return `data:${mime};base64,${fileInfo.data}`;
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
        console.log(playlistArr[0]?.name);
        return playlistArr;
    } catch (error) {
        return [];
    }
}
export async function getPlaylistData(id) {
    try {
        const contents = await Filesystem.readFile({
            path: 'playlists/'+id+'.txt',
            directory: Directory.LibraryNoCloud,
            encoding: Encoding.UTF8,
        });
        return JSON.parse(contents.data);
    } catch {
        return;
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
initializeOfflineUpdates();
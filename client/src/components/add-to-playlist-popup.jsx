import Popup from 'reactjs-popup';
import * as serverApi from '../apis/server-api';
import { useState, useEffect } from 'react';
import * as ListItemCreator from './list-items';

export default function AddToPlaylistPopup({ song, setSong, refreshLibrary } ) {
    const closeModal = () => {
        setSong({});
    }
    const handlePlaylistClick = async (playlist) => {
        console.log('Adding song ' + song.title + ' to playlist ' + playlist.name);
        const songToAdd = song;
        closeModal();
        console.log(songToAdd);
        try {
            await serverApi.downloadSong(songToAdd, 'playlist', playlist._id);
            console.log('Song added to playlist successfully');
            if (typeof refreshLibrary === 'function') {
                refreshLibrary();
            }
        } catch (error) {
            console.error('Failed to add song to playlist:', error);
        }
    }
    const [playlists, setPlaylists] = useState([]);

    useEffect(() => {
        const loadPlaylists = async () => {
            const data = await serverApi.getLibrary();
            setPlaylists(data);
        };
        loadPlaylists();
    }, [song]);

    return (
        <Popup open={!!song.title} closeOnDocumentClick onClose={closeModal} position="right center">
            <div>
                <h3> Add to Playlist </h3>
                {playlists.length > 0 ? playlists.map((playlist) => <ListItemCreator.CreateLibraryItem key={playlist._id || playlist.name} playlist={playlist} callback={handlePlaylistClick} />) : <p> No playlists yet. Try creating one! </p>}
            </div>
        </Popup>
    );
}
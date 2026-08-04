import Popup from 'reactjs-popup';
import * as serverApi from '../apis/server-api';
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

const EditPlaylistPopup = forwardRef((props, ref) => {
    const [open, setOpen] = useState(false);
    const [playlist, setPlaylist] = useState({});
    const [playlistName, setPlaylistName] = useState("");
    useImperativeHandle(ref, () => ({
        showPopup(_playlist) {
            setOpen(true);
            setPlaylist(_playlist);
            if (_playlist) {
                setPlaylistName(_playlist.name);
            } else {
                setPlaylistName("");
            }
        },
        async deletePlaylist(id) {
            await serverApi.deletePlaylist(id)
            props.libraryReload();
        }
    }));
    async function update() {
        if (playlist) {
            if (playlist.name != playlistName) {
                // Update Playlist
                await serverApi.editPlaylist(playlistName, playlist._id);
                props.libraryReload();
            }
        } else {
            if (playlistName != "") {
                // New Playlist
                await serverApi.editPlaylist(playlistName)
                props.libraryReload();
            }
        }
    }
    return(
        <Popup open={open} closeOnDocumentClick onClose={() => {setOpen(false)}} position="right center">
            <div>
                <h3> {playlist ? "Edit Playlist" : "New Playlist"} </h3>
                <form className="search-form" onSubmit={(e) => { e.preventDefault(); update(); setOpen(false);} }>
                    <input placeholder='Playlist Name...' value={playlistName} onChange={(e)=>{setPlaylistName(e.target.value)}}></input>
                    <button> Save </button>
                </form>
            </div>
        </Popup>
    );
});
export default EditPlaylistPopup;
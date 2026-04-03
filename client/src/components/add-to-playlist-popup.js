import Popup from 'reactjs-popup';
import { getPlaylists } from '../apis/server-api';
import { useState } from 'react';

function CreateLibraryItem(playlist, callback) {
  const songCount = playlist.songs.length;
  const name = playlist.name;
  const image = playlist.artworkPath ? 'http://localhost:8080/media/' + playlist.artworkPath : 'https://placehold.co/300x300?text=' + name;
  const handleClick = () => {
    callback(playlist);
  }
  return (
    <div className="library-item" onClick={handleClick}>
      <img src={image} onerror="this.onerror=null; this.src='https://placehold.co/300x300?text=No+Image';" alt="Playlist Image"></img>
      <h3> {playlist.name} </h3>
      <p> {songCount} songs</p>
    </div>
  )
}

export default function AddToPlaylistPopup(song) {
    const handlePlaylistClick = (playlist) => {
        console.log('Adding song ' + song + ' to playlist ' + playlist.name);
        // Make API call to add song to playlist
    }
    const [playlists, setPlaylists] = useState([]);

        console.log('Fetching playlists...');
    
        setPlaylists([]);

        const data = getPlaylists();

        const items = data.map(async (playlist) => {
            return CreateLibraryItem(playlist, handlePlaylistClick);
        });

        setPlaylists(items);
    
      
    return (
        <Popup trigger={<button className="AddButton"> + </button>} modal position="right center">
            <div>
            <h3> Add to Playlist </h3>
            {playlists}
            </div>
        </Popup>
    );
}
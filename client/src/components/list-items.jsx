import axios from 'axios';

export function CreateSearchItem(songName, artistName, imageUrl, songUrl, _mbid, _albumMbid, addCallback) {
  const artistUrl = songUrl.substring(0, songUrl.lastIndexOf('/_/'));
  function handleClick() {
    addCallback(songName, artistName, imageUrl, _mbid, _albumMbid);
  }
  return (
    <div className="search-item">
      <img src={imageUrl} onerror="this.onerror=null; this.src='https://placehold.co/300x300?text=No+Image';" alt="Song Image"></img>
      <a className="SongName" href={songUrl}> {songName} </a>
      <a className="ArtistName" href={artistUrl}> {artistName} </a>
      <button className="AddButton" onClick={handleClick}> + </button>
    </div>
  );
}
export function CreateLibraryItem(playlist, callback) {
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
export function CreateLibraryItem2(playlist, callback) {
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

export function CreateSongItem(song, playCallback) {
  function handleClick() {
    playCallback(song._id);
  }
  return (
    <div className="search-item">
      <img src={'http://localhost:8080/media/'+song.artworkPath} onerror="this.onerror=null; this.src='https://placehold.co/300x300?text=No+Image';" alt="Song Image"></img>
      <div className="song-details">
        <h3 className="SongName" > {song.title} </h3>
        <h4 className="ArtistName"> {song.artist} </h4>
      </div>
      <button className="PlayButton" onClick={handleClick}> Play </button>
    </div>
  );
}
import axios from 'axios';
export function CreateSearchItem(songName, artistName, imageUrl, songUrl, _mbid) {
  const artistUrl = songUrl.substring(0, songUrl.lastIndexOf('/_/'));
  function handleClick() {
    axios.get('http://192.168.0.82:8080/api/download', { params: { title: songName, artist: artistName, artworkUrl: imageUrl, mbid: _mbid } }).then((data) => {
      console.log(data);
    });
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
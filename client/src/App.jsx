import axios from 'axios';
import './App.css';
import AudioPlayer from 'react-h5-audio-player';
import './AudioPlayer.css';
import * as lastfm from './apis/last-fm';
import * as ListItemCreator from './components/list-items';
import NowPlaying from './components/now-playing';
import React, { useState, useEffect, createRef } from "react";
import { Group, Panel } from "react-resizable-panels";
import Popup from 'reactjs-popup';

// npm start to run frontend
const SERVER_API_URL = 'http://localhost:8080/';


const apiCall = () => {
  axios.get(SERVER_API_URL + 'api/get_song').then((data) => {
    //this console.log will be in our frontend console
    const songURL = data.data;
    axios.get(songURL).then((songData) => {
      console.log(songData.data);
    })
  })
}

let clickedSong = {};

function App() {
  const [listItems, setListItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [centerContent, setCenterContent] = useState('none'); // 'search', 'playlist', 'queue'. 'none'

  const [nowPlaying, setNowPlaying] = useState({});
  const [useAutoPlay, setUseAutoPlay] = useState(false);
  const [libraryItems, setLibraryItems] = useState([]);
  const [popupLibraryItems, setPopupLibraryItems] = useState([]);
  const [openPlaylist, setOpenPlaylist] = useState(null);
  const [playlistPopupOpen, setPlaylistPopupOpen] = useState(false);

  const player = createRef();

  const getNowPlaying = () => {
    axios.get(SERVER_API_URL + 'api/get_now_playing').then((data) => {
      setNowPlaying(data.data);
    })
  }
  const populateLibrary = () => { 
    axios.get(SERVER_API_URL + 'api/get_library').then((data) => {
      setLibraryItems([]);

      const playlists = data.data;

      const items = playlists.map(async (playlist) => {
        return ListItemCreator.CreateLibraryItem(playlist, handleLibraryClick);
      });

      setLibraryItems(items);

      const items2 = playlists.map(async (playlist) => {
        return ListItemCreator.CreateLibraryItem(playlist, handlePopupItemClick);
      });

      setPopupLibraryItems(items2);

    });
  }
  useEffect(() => {
    getNowPlaying();
    populateLibrary();
  }, []);

  const createPlaylist = () => {
    axios.get(SERVER_API_URL + 'api/create_playlist', { params: { name: 'New Playlist' } }).then((data) => {
      console.log(data.data);

      populateLibrary();
    })
  }

  const nextSong = () => {
    console.log('Next song');
    axios.get(SERVER_API_URL + 'api/control_queue', { params: { action: 'next' } }).then((data) => {
      setUseAutoPlay(true);
      setNowPlaying(data.data);
    })
  }
  const prevSong = () => {
    console.log('Previous song');
    axios.get(SERVER_API_URL + 'api/control_queue', { params: { action: 'prev' } }).then((data) => {
      setUseAutoPlay(true);
      setNowPlaying(data.data);
    })
    //getNowPlaying();
  }
  const playSong = (_song) => {
    console.log(_song);
    axios.get(SERVER_API_URL + 'api/control_queue', { params: { action: 'play', songId: _song } }).then((data) => {
      setNowPlaying(data.data);
      console.log(data.data);
    });
    setUseAutoPlay(true);
  }

  const handleInputChange = (event) => {
    setSearchQuery(event.target.value);
  };

  function addToPlaylistPopup(title, artistName, artworkUrl, mbid, albumMbid) {
    clickedSong = { title, artistName, artworkUrl, mbid, albumMbid };
    setPlaylistPopupOpen(true);
  }
  async function search() {
    setListItems([]);
    setCenterContent('search');
    const tracks = await lastfm.searchLastFM(searchQuery);
    console.log(tracks);
    // Build the list of React elements then set state once.
    const items = tracks.map(async (track) => {
      const info = await lastfm.getTrackInfo(track.name, track.artist);
      const _songName = track.name;
      const _artistName = track.artist;
      const _mbid = track.mbid;
      let _albumMbid = null;
      let _imageUrl = 'https://placehold.co/300x300?text=No+Image'
      if (info && info.album && info.album.image && info.album.image[2] && info.album.image[2]['#text']) {
        _imageUrl = info.album.image[3]['#text'];
      }
      if (info && info.album && info.album.mbid) {
        _albumMbid = info.album.mbid;
      }
      console.log(info);
      const _songUrl = track.url;
      return ListItemCreator.CreateSearchItem(_songName, _artistName, _imageUrl, _songUrl, _mbid, _albumMbid, addToPlaylistPopup);
    });

    setListItems(items);
  }
  async function handlePopupItemClick(playlist) {
    console.log('Adding song to playlist: ' + playlist.name);
    console.log(clickedSong);
    setPlaylistPopupOpen(false);
    const response = await axios.get(SERVER_API_URL + 'api/download', { params: { artist: clickedSong.artistName, title: clickedSong.title, artworkUrl: clickedSong.artworkUrl, mbid: clickedSong.mbid, albumMbid: clickedSong.albumMbid } });
    const response2 = await axios.get(SERVER_API_URL + 'api/add_to_playlist', { params: { playlistId: playlist._id, songId: response.data._id } });
    populateLibrary();
  }
  const closePopup = () => setPlaylistPopupOpen(false);

  async function handleLibraryClick(playlist) {
    setListItems([]);
    setOpenPlaylist(playlist);
    setCenterContent('playlist');
    const songs = playlist.songs;
    const items = songs.map((song) => {
      return ListItemCreator.CreateSongItem(song, playSong);
    });
    setListItems(items);
    console.log(songs);
  }
  function handleCenterCloseClick() {
    setCenterContent('none');
  }

  return (
    <div className="App">
      <div style={nowPlaying?.artworkPath ? {'--background-image': `url('${SERVER_API_URL}media/${nowPlaying.artworkPath}')`} : {}} className="background-image"></div>
      <header className="App-header">
        <div className="top-bar">
          <input
            type="text"
            placeholder="Search library..."
            onChange={handleInputChange}
          />
          <button onClick={search}>Search</button>
        </div>
        
        <Group className="grid">
          <Panel defaultSize={30} minSize={'8%'} className="panel" collapsible={true}>
            <h2>Library</h2> 

            <button className="NewPlaylistButton" onClick={createPlaylist}> + New Playlist </button>
            {libraryItems.length > 0 ? libraryItems : <p> No library items yet. Try adding some songs to your library! </p>}
          </Panel>

          {centerContent === 'none' || (
            <>
              <Panel defaultSize={40} minSize={'40%'} className="panel">
                <Popup open={playlistPopupOpen} closeOnDocumentClick onClose={closePopup} modal>
                  <div>
                  <h3> Add to Playlist </h3>
                  {popupLibraryItems}
                  </div>
                </Popup>
                <button className="CenterCloseButton" onClick={handleCenterCloseClick}> X </button>
                {centerContent === 'search' && <h2>Search Results</h2>}
                {centerContent === 'playlist' && <h2>Playlist</h2>}
                {centerContent === 'queue' && <h2>Queue</h2>}

                {centerContent === 'search' && (listItems.length > 0 ? listItems : <p> Searching... </p>)}
                {centerContent != 'playlist' || (
                  <>
                    <img className="playlist-image" src={openPlaylist.artworkPath ? 'http://localhost:8080/media/' + openPlaylist.artworkPath : 'https://placehold.co/300x300?text=' + openPlaylist.name} alt="Playlist cover" />
                    <div className="playlist-details">
                      <h3> {openPlaylist.name} </h3>
                      <p> {openPlaylist.songs.length} songs </p>
                      <button className="PlayButton"> Play </button>
                    </div>
                    {listItems.length > 0 ? listItems : <p> No songs in this playlist yet. Try adding some! </p>}
                  </>
                )}
                {centerContent === 'queue' && <p> Queue content coming soon! </p>}
              </Panel>
            </>
          )}

          <NowPlaying song={nowPlaying}></NowPlaying>
        </Group>
          
        <AudioPlayer
              className='audio-player'
              src= {SERVER_API_URL + 'media/'+ nowPlaying.songPath}
              onClickNext={nextSong}
              onClickPrevious={prevSong}
              onEnded={nextSong}
              autoPlay={useAutoPlay}
              showJumpControls={false}
              showSkipControls={true}
              ref={player}
              // other props here
          />
          
        
      </header>
    </div>
  );
}

export default App;

import axios from 'axios';
import './App.css';
import AudioPlayer from 'react-h5-audio-player';
import './AudioPlayer.css';
import * as lastfm from './apis/last-fm';
import * as ListItemCreator from './components/list-items';
import NowPlaying from './components/now-playing';
import React, { useState, useEffect, createRef } from "react";
import { Group, Panel } from "react-resizable-panels";

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

function App() {
  const [listItems, setListItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [centerContent, setCenterContent] = useState('none'); // 'search', 'playlist', 'queue'. 'none'

  const [nowPlaying, setNowPlaying] = useState({});
  const [useAutoPlay, setUseAutoPlay] = useState(false);
  const [libraryItems, setLibraryItems] = useState([]);

  const player = createRef();

  const getNowPlaying = () => {
    axios.get(SERVER_API_URL + 'api/get_now_playing').then((data) => {
      setNowPlaying(data.data);
    })
  }
  const populateLibrary = () => { 
    axios.get(SERVER_API_URL + 'api/get_library').then((data) => {
      console.log(data.data);

      setLibraryItems([]);

      const playlists = data.data;

      const items = playlists.map(async (playlist) => {
        return ListItemCreator.CreateLibraryItem(playlist, handleLibraryClick);
      });

      setLibraryItems(items);

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
    getNowPlaying();
  }

  const backgroundStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    '-webkit-transition': 'background-image 0.7s ease',

    'background-image': 'url(' + SERVER_API_URL + 'media/' + nowPlaying.artworkPath + ')',
    'background-size': 'cover',
    'background-position': 'center',
    'z-index': '-1000',

    'filter': 'blur(4px)',
    '-webkit-filter': 'blur(4px)',
  }

  const handleInputChange = (event) => {
    setSearchQuery(event.target.value);
  };

  async function apiCall2() {
    setListItems([]);
    setCenterContent('search');
    const tracks = await lastfm.searchLastFM(searchQuery);
    console.log(tracks);
    // Build the list of React elements then set state once.
    const items = tracks.map(async (track) => {
      const info = await lastfm.getTrackInfo(track.mbid);
      const _songName = track.name;
      const _artistName = track.artist;
      const _mbid = track.mbid;
      let _imageUrl = 'https://placehold.co/300x300?text=No+Image'
      if (info && info.album && info.album.image && info.album.image[2] && info.album.image[2]['#text']) {
        _imageUrl = info.album.image[3]['#text'];
      }
      const _songUrl = track.url;
      return ListItemCreator.CreateSearchItem(_songName, _artistName, _imageUrl, _songUrl, _mbid);
    });

    setListItems(items);
  }

  async function handleLibraryClick(playlist) {
    setListItems([]);
    setCenterContent('playlist');
    const songs = playlist.songs;
    console.log(songs);
  }
  function handleCenterCloseClick() {
    setCenterContent('none');
  }

  return (
    <div className="App">
      <div style={backgroundStyle} className="background-image"></div>
      <header className="App-header">
        <div className="top-bar">
          <input
            type="text"
            placeholder="Search library..."
            onChange={handleInputChange}
          />
          <button onClick={apiCall2}>Search</button>
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
                <button className="CenterCloseButton" onClick={handleCenterCloseClick}> X </button>
                {centerContent === 'search' && <h2>Search Results</h2>}
                {centerContent === 'playlist' && <h2>Playlist</h2>}
                {centerContent === 'queue' && <h2>Queue</h2>}

                {centerContent === 'search' && (listItems.length > 0 ? listItems : <p> Searching... </p>)}
                {centerContent != 'playlist' || (
                  <>
                    <img className="playlist-image" src={'http://localhost:8080/media/'+nowPlaying.artworkPath} alt="Playlist cover" />
                    <div className="playlist-details">
                      <h3> {'New Playlist'} </h3>
                      <p> {'100 songs'} </p>
                      <button className="PlaylistPlayButton"> Play </button>
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

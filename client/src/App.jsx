import axios from 'axios';
import './App.css';
import AudioPlayer from 'react-h5-audio-player';
import './AudioPlayer.css';
import * as lastfm from './apis/last-fm';
import * as listItems from './components/list-items';
import NowPlaying from './components/now-playing';
import React, { useState, useEffect, createRef } from "react";

// npm start to run frontend
const SERVER_API_URL = 'http://192.168.0.82:8080/';


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
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [nowPlaying, setNowPlaying] = useState({});
  const [useAutoPlay, setUseAutoPlay] = useState(false);

  const player = createRef();

  const getNowPlaying = () => {
    axios.get(SERVER_API_URL + 'api/get_now_playing').then((data) => {
      //console.log(data.data);
      setNowPlaying(data.data);
    })
  }
  useEffect(() => {
    getNowPlaying();
  }, []);

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
    'z-index': -1,

    'filter': 'blur(4px)',
    '-webkit-filter': 'blur(4px)',
  }

  const handleInputChange = (event) => {
    setSearchQuery(event.target.value);
  };

  async function apiCall2() {
    setSearchResults([]);
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
      return listItems.CreateSearchItem(_songName, _artistName, _imageUrl, _songUrl, _mbid);
    });

    setSearchResults(items);
  }
  return (
    <div className="App">
      <header className="App-header">
        <div style={backgroundStyle} className="background-image"></div>
        <div className="main-container">
          <div className="top-bar">
            <input
              type="text"
              placeholder="Search library..."
              onChange={handleInputChange}
            />
            <button onClick={apiCall2}>Search</button>
          </div>
          

          <div className="library"> 
            <h2>Library</h2> 

            <div className="library-item">
              <img src="https://cdn.mos.cms.futurecdn.net/v2/t:0,l:280,cw:720,ch:720,q:80,w:720/3DwQ9MW53hnVgE2U6BJQJS.jpg"></img>
              <a href="https://google.com"> Playlist Name </a>
              <p> 100 songs</p>
            </div>
            <div className="library-item">
              <img src="https://cdn.mos.cms.futurecdn.net/v2/t:0,l:280,cw:720,ch:720,q:80,w:720/3DwQ9MW53hnVgE2U6BJQJS.jpg"></img>
              <a href="https://google.com"> Playlist Name </a>
              <p> 100 songs</p>
            </div>
            
          </div>

          <div className="center-window"> 
            <h2>Search Results</h2>

            {searchResults.length > 0 ? searchResults : <p> No search results yet. Try searching for a song! </p>}
          
          </div>

          <NowPlaying song={nowPlaying}></NowPlaying>
          
          
        </div>
        <AudioPlayer
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

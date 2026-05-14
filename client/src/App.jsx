import axios from 'axios';
import './App.css';
import AudioPlayer from 'react-h5-audio-player';
import './AudioPlayer.css';
import * as lastfm from './apis/last-fm';
import * as ListItemCreator from './components/list-items';
import * as serverApi from './apis/server-api';
import NowPlaying from './components/now-playing';
import React, { useState, useEffect, useRef } from "react";
import { Group, Panel } from "react-resizable-panels";
import Popup from 'reactjs-popup';
import LibraryList from './components/library-list';
import Playlist from './components/playlist';
import SearchResults from './components/search-results';
import Queue from './components/queue';
import Lyrics from './components/lyrics';
import Login from './components/login';

import { motion } from 'motion/react';
import * as nativeApi from './apis/native-api';
import { FaSearch } from "react-icons/fa";
import { Toaster } from 'react-hot-toast';

// npm start to run frontend

let clickedSong = {};

function App() {
  const [listItems, setListItems] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');

  const [centerContent, setCenterContent] = useState('none'); // 'search', 'playlist', 'queue'. 'none'
  const [lastCenterContent, setLastCenterContent] = useState('none');

  const [centerContententData, setCenterContentData] = useState({});
  const [nowPlaying, setNowPlaying] = useState({});
  const [posInSong, setPosInSong] = useState(0);
  const [isSignedIn, setIsSignedIn] = useState(false);
  
  const [useAutoPlay, setUseAutoPlay] = useState(false);
  const [libraryItems, setLibraryItems] = useState(null);
  const [libraryReload, setLibraryReload] = useState(0);
  const [popupLibraryItems, setPopupLibraryItems] = useState([]);
  const [openPlaylist, setOpenPlaylist] = useState(null);
  const [playlistPopupOpen, setPlaylistPopupOpen] = useState(false);

  const player = useRef(null);
  const library = useRef(null);
  const searchResultsRef = useRef(null);

  const getNowPlaying = async() => {
    const response = await serverApi.getNowPlaying();
    setNowPlaying(response);
  }
  const populateLibrary = async() => { 
    const playlists = await serverApi.getLibrary();
    setLibraryItems(playlists);

    setPopupLibraryItems(playlists);

  };
  useEffect(() => {
    nativeApi.init(window);
    async function login() {
      const success = await serverApi.checkLogin();
      setIsSignedIn(success);
    }
    login()
    
    const playEventCallback = async(isPlaying) => {
      console.log('Received play event from server: ' + isPlaying);
      console.log(player.current);
      if (player.current) {
        await getNowPlaying();
        if (isPlaying) {
          player.current.audio.current.play();
        } else {
          player.current.audio.current.pause();
        }
      }
    }
    nativeApi.subscribeToPlayEvent(playEventCallback);
    serverApi.subscribeToPlayEvent(playEventCallback);
  }, []);
  useEffect(() => {
    if (isSignedIn) {
      getNowPlaying();
      populateLibrary();
    }
  }, [isSignedIn]);

  const createPlaylist = async () => {
    const response = await serverApi.createPlaylist('New Playlist');
    console.log(response);
    await populateLibrary();
  }

  const nextSong = async () => {
    console.log('Next song');
    const response = await serverApi.controlQueue('next');
    setUseAutoPlay(true);
    setNowPlaying(response);
    serverApi.startPlayingOnAllClients();
  }
  const prevSong = async () => {
    console.log('Previous song');
    const response = await serverApi.controlQueue('prev');
    setUseAutoPlay(true);
    setNowPlaying(response);
    serverApi.startPlayingOnAllClients();
  }
  const playSong = async (response) => {
    setUseAutoPlay(true);
    console.log(response);
    await getNowPlaying();
    if (response) {
      await setNowPlaying(response);
    }
    
    serverApi.startPlayingOnAllClients();
  }
  const handleInputChange = (event) => {
    setSearchQuery(event.target.value);
  };
  async function playSongFromSearch(songName, artistName, artworkUrl) {
    console.log('Playing song from search: ' + songName + ' by ' + artistName);
    const response = await serverApi.addStreamedSong(artistName, songName, artworkUrl)
    await playSong(response._id);
    console.log(nowPlaying);
  }
  function addToPlaylistPopup(title, artistName, artworkUrl, mbid, albumName) {
    clickedSong = { title, artistName, artworkUrl, mbid, albumName };
    setPlaylistPopupOpen(true);
  }
  async function search() {
    setCenterContent('search');
    if (searchResultsRef.current?.performSearch) {
      await searchResultsRef.current.performSearch();
    }
  }
  async function handlePopupItemClick(playlist) {
    console.log('Adding song to playlist: ' + playlist.name);
    console.log(clickedSong);
    setPlaylistPopupOpen(false);
    const response = await serverApi.downloadSong(clickedSong);
    const response2 = await serverApi.addToPlaylist(playlist._id, response._id);
    populateLibrary();
  }
  const closePopup = () => setPlaylistPopupOpen(false);

  function handleCenterCloseClick() {
    setCenterContent('none');
  }
  const changeCenterContent = async (content) => {
    await setLastCenterContent(centerContent);
    await setCenterContent(content);
  }
  const reverseCenterContent = async () => {
    await setCenterContent(lastCenterContent);
    await setLastCenterContent('none');
  }

  return (
    <div className="App">
      < Toaster 
          toastOptions={{
            className: '',
            style: {
              marginTop: '38px',
              backdropFilter: 'blur(18px)',
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              color: 'white',
              borderRadius: 10,
              padding: 12,
            },
          }}
      />
      <div style={nowPlaying?.artworkPath ? {'--background-image': `url('${serverApi.getMediaUrl()}${nowPlaying.artworkPath}')`} : {}} className="background-image"></div>
      <header className="App-header">
        <title>Ecostream</title>
        {isSignedIn &&
        <>
        <div className="top-bar">
          <form className="search-form" onSubmit={(e) => { e.preventDefault(); search(); }}>
            <input
              type="text"
              placeholder="Search library..."
              value={searchQuery}
              onChange={handleInputChange}
            />
            <button><FaSearch /></button>
          </form>
          <button className="PlayButton2"> User </button>
        </div>
        
        <Group className="grid">
          <LibraryList centerContent={changeCenterContent} setData={setCenterContentData} refreshTrigger={libraryReload} ref={library}></LibraryList>

          {centerContent=='playlist' && (
            <Playlist data={centerContententData} playCallback={playSong} setCenterContent={changeCenterContent}></Playlist>
          )}
          {centerContent=='search' && (
            <SearchResults searchQuery={searchQuery} ref={searchResultsRef} onLibraryUpdated={() => setLibraryReload((prev) => prev + 1)} setCenterContent={changeCenterContent}></SearchResults>
          )}
          {centerContent=='queue' && (
            <Queue playCallback={playSong} setCenterContent={changeCenterContent} reverseCenterContent={reverseCenterContent}></Queue>
          )}
          {centerContent=='lyrics' && (
            <Lyrics song={nowPlaying} setCenterContent={changeCenterContent} posInSong={posInSong}></Lyrics>
          )}

          <NowPlaying song={nowPlaying} setCenterContent={changeCenterContent} ></NowPlaying>
        </Group>
          
        <AudioPlayer
              className='audio-player'
              src= {!nowPlaying.isStream ? serverApi.getMediaUrl() + nowPlaying.songPath : 'http://localhost:8080/api/get_song_stream?videoId=' + nowPlaying.songPath}
              onClickNext={nextSong}
              onClickPrevious={prevSong}
              onEnded={nextSong}
              onPlay={serverApi.startPlayingOnAllClients}
              onPause={serverApi.stopPlayingOnAllClients}
              onListen={(e) => setPosInSong(e.target.currentTime)}
              autoPlay={useAutoPlay}
              showJumpControls={false}
              showSkipControls={true}
              ref={player}
              // other props here
          />
        </>
        }
        {!isSignedIn &&
          <Login setSignedIn={setIsSignedIn}/>
        }
        
        
      </header>
    </div>
  );
}

export default App;

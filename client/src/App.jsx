import './App.css';
import AudioPlayer from 'react-h5-audio-player';
import * as serverApi from './apis/server-api';
import NowPlaying from './components/now-playing';
import React, { useState, useEffect, useRef } from "react";
import { Group } from "react-resizable-panels";
import LibraryList from './components/library-list';
import Playlist from './components/playlist';
import SearchResults from './components/search-results';
import Queue from './components/queue';
import Lyrics from './components/lyrics';
import Login from './components/login';
import Player from './components/player';
import NavigationDock from './components/navigation-dock';
import { KeepAwake } from '@capacitor-community/keep-awake';
import * as nativeApi from './apis/native-api';
import { FaSearch, FaUser } from "react-icons/fa";
import { Toaster } from 'react-hot-toast';

// npm start to run frontend

let clickedSong = {};

function App() {

  const [searchQuery, setSearchQuery] = useState('');

  const [centerContent, setCenterContent] = useState('none'); // 'search', 'playlist', 'queue'. 'none'
  const [lastCenterContent, setLastCenterContent] = useState('none');

  const [centerContententData, setCenterContentData] = useState({});
  const [nowPlaying, setNowPlaying] = useState({});
  const [posInSong, setPosInSong] = useState(0);
  const [isSignedIn, setIsSignedIn] = useState('false');
  
  const [useAutoPlay, setUseAutoPlay] = useState(false);
  const [libraryReload, setLibraryReload] = useState(0);
  const [playlistPopupOpen, setPlaylistPopupOpen] = useState(false);

  const useIsMobile = (breakpoint = 768) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
    useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [breakpoint]);
    return isMobile;
  };
  const isMobile = useIsMobile();

  const player = useRef(null);
  const library = useRef(null);
  const searchResultsRef = useRef(null);

  const getNowPlaying = async() => {
    const response = await serverApi.getNowPlaying();
    setNowPlaying(response);
  }
  useEffect(() => {
    nativeApi.init(window);
    
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

    async function keepAwake() {
      if (await KeepAwake.isSupported.isSupported) {
        await KeepAwake.keepAwake();
      }
    }
    keepAwake();

  }, []);
  useEffect(() => {
    if (isSignedIn == 'true') {
      getNowPlaying();
    }
  }, [isSignedIn]);

  const createPlaylist = async () => {
    const response = await serverApi.createPlaylist('New Playlist');
    console.log(response);
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
        {isSignedIn=='true' &&
        <>
        {!isMobile &&
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
            <button className="PlayButton" onClick={()=>{setIsSignedIn('loggedOut')}}> <FaUser /> </button>
          </div>
        }
        {isMobile && 
          <Group className="grid"> 
            {centerContent=='none' &&
              <NowPlaying song={nowPlaying} setCenterContent={changeCenterContent} isMobile={isMobile} ></NowPlaying>
            }
            {centerContent=='library' &&
              <LibraryList centerContent={changeCenterContent} setData={setCenterContentData} refreshTrigger={libraryReload} ref={library}></LibraryList>
            }
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
            
          </Group>
        }

        {!isMobile &&
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

            <NowPlaying song={nowPlaying} setCenterContent={changeCenterContent} isMobile={isMobile} ></NowPlaying>
          </Group>
        }
        <Player song={nowPlaying} setSong={setNowPlaying} setPosInSong={setPosInSong} setCenterContent={changeCenterContent} isMobile={isMobile}/>
        {isMobile &&
          <NavigationDock setCenterContent={changeCenterContent} setSignedIn={setIsSignedIn}/>
        }
        </>
        }
        {isSignedIn!='true' &&
          <Login setSignedIn={setIsSignedIn} signedInState={isSignedIn}/>
        }
        
        
      </header>
    </div>
  );
}

export default App;

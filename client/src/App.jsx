import './App.css';
import AudioPlayer from 'react-h5-audio-player';
import * as serverApi from './apis/server-api';
import * as queueApi from './apis/queue-api';
import NowPlaying from './components/now-playing';
import React, { useState, useEffect, useRef } from "react";
import { Group } from "react-resizable-panels";
import LibraryList from './components/library-list';
import Playlist from './components/playlist';
import SearchResults from './components/search-results';
import Queue from './components/queue';
import Lyrics from './components/lyrics';
import Settings from './components/settings';
import DeviceSelect from './components/device-select';
import Login from './components/login';
import Player from './components/player';
import NavigationDock from './components/navigation-dock';
import EditPlaylistPopup from './components/edit-playlist-popup';
import { KeepAwake } from '@capacitor-community/keep-awake';
import * as nativeApi from './apis/native-api';
import { FaSearch, FaUser } from "react-icons/fa";
import { FaGear } from "react-icons/fa6";
import { Toaster } from 'react-hot-toast';

// npm start to run frontend

let clickedSong = {};

function App() {

  const [searchQuery, setSearchQuery] = useState('');
  const [actualSearchQuery, setActualSearchQuery] = useState('');

  const [centerContent, setCenterContent] = useState('none'); // 'search', 'playlist', 'queue'. 'none'
  const [lastCenterContent, setLastCenterContent] = useState('none');

  const [centerContententData, setCenterContentData] = useState({});
  const [nowPlaying, setNowPlaying] = useState({});
  const [posInSong, setPosInSong] = useState(0);
  const [isSignedIn, setIsSignedIn] = useState('false');
  const [isOnline, setIsOnline] = useState(true);
  const [backgroundImage, setBackgroundImage] = useState('');

  const editPlaylistRef = useRef(null);
  
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
    const response = await queueApi.getSong();
    setNowPlaying(response);
  }
  useEffect(() => {
    nativeApi.init(window);

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
  useEffect(()=> {
    serverApi.getImageUrl(nowPlaying.artworkPath, setBackgroundImage)
  }, [nowPlaying._id]);
  useEffect(()=> {
    if (centerContent === 'none' && isMobile) {
      document.documentElement.style.setProperty('--isMobile', '-90px');
    } else {
      document.documentElement.style.setProperty('--isMobile', '0px');
    }
  }, [isMobile, centerContent])
  const playSong = async (response) => {
    setUseAutoPlay(true);
    console.log(response);
    await getNowPlaying();
    if (response) {
      await setNowPlaying(response);
    }
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
    setActualSearchQuery(searchQuery);
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
      <div style={nowPlaying?.artworkPath ? {'--background-image': `url('${backgroundImage}')`} : {}} className="background-image"></div>
      <header className="App-header">
        <title>Ecostream</title>
        {(isSignedIn=='true' || !isOnline) &&
        <>
        <EditPlaylistPopup ref={editPlaylistRef} libraryReload={() => setLibraryReload((prev) => prev + 1)}/>
        {(!isMobile || centerContent=='search') &&
          <div className="top-bar" style={{marginTop: isMobile? '20px' : '5px'}}>
            <form className="search-form" onSubmit={(e) => { e.preventDefault(); search(); }}>
              <input
                type="text"
                placeholder="Search library..."
                value={searchQuery}
                onChange={handleInputChange}
              />
              <button><FaSearch /></button>
            </form>
            <button className="PlayButton" onClick={()=>{changeCenterContent('settings')}} style={{marginRight: '10px'}}> <FaGear /> </button>
            <button className="PlayButton" onClick={()=>{setIsSignedIn('loggedOut')}}> <FaUser /> </button>
          </div>
        }
        {isMobile && 
          <>
          <Group className="grid" style={{marginTop: centerContent!=='search'? '20px' : '5px'}}> 
            {centerContent=='none' &&
              <NowPlaying song={nowPlaying} setCenterContent={changeCenterContent} isMobile={isMobile} onLibraryUpdated={() => setLibraryReload((prev) => prev + 1)}></NowPlaying>
            }
            {centerContent=='library' &&
              <LibraryList currentData={centerContententData} centerContent={changeCenterContent} setData={setCenterContentData} refreshTrigger={libraryReload} ref={library} editRef={editPlaylistRef} isOnline={isOnline}></LibraryList>
            }
            {centerContent=='playlist' && (
              <Playlist data={centerContententData} playCallback={playSong} setCenterContent={changeCenterContent} editRef={editPlaylistRef}></Playlist>
            )}
            {centerContent=='search' && (
              <SearchResults searchQuery={actualSearchQuery} ref={searchResultsRef} onLibraryUpdated={() => setLibraryReload((prev) => prev + 1)} setCenterContent={changeCenterContent} isMobile={isMobile}></SearchResults>
            )}
            {centerContent=='queue' && (
              <Queue playCallback={playSong} reverseCenterContent={reverseCenterContent} currentSong={nowPlaying}></Queue>
            )}
            {centerContent=='lyrics' && (
              <Lyrics song={nowPlaying} setCenterContent={changeCenterContent} posInSong={posInSong}></Lyrics>
            )}
            {centerContent=='devices' && (
              <DeviceSelect reverseCenterContent={reverseCenterContent}></DeviceSelect>
            )}
            {centerContent=='settings' && (
              <Settings reverseCenterContent={reverseCenterContent}></Settings>
            )}
            
          </Group>
          <NavigationDock setCenterContent={changeCenterContent} setSignedIn={setIsSignedIn}/>
          </>
        }

        {!isMobile &&
          <Group className="grid">
            <LibraryList currentData={centerContententData} centerContent={changeCenterContent} setData={setCenterContentData} refreshTrigger={libraryReload} ref={library} editRef={editPlaylistRef} isOnline={isOnline}></LibraryList>

            {centerContent=='playlist' && (
              <Playlist data={centerContententData} playCallback={playSong} setCenterContent={changeCenterContent} editRef={editPlaylistRef}></Playlist>
            )}
            {centerContent=='search' && (
              <SearchResults searchQuery={actualSearchQuery} ref={searchResultsRef} onLibraryUpdated={() => setLibraryReload((prev) => prev + 1)} setCenterContent={changeCenterContent} isMobile={isMobile}></SearchResults>
            )}
            {centerContent=='queue' && (
              <Queue playCallback={playSong} setCenterContent={changeCenterContent} reverseCenterContent={reverseCenterContent} currentSong={nowPlaying}></Queue>
            )}
            {centerContent=='lyrics' && (
              <Lyrics song={nowPlaying} setCenterContent={changeCenterContent} posInSong={posInSong}></Lyrics>
            )}
            {centerContent=='devices' && (
              <DeviceSelect reverseCenterContent={reverseCenterContent}></DeviceSelect>
            )}
            {centerContent=='settings' && (
              <Settings reverseCenterContent={reverseCenterContent}></Settings>
            )}

            <NowPlaying song={nowPlaying} setCenterContent={changeCenterContent} isMobile={isMobile} onLibraryUpdated={() => setLibraryReload((prev) => prev + 1)}></NowPlaying>
          </Group>
        }
        <Player song={nowPlaying} setSong={setNowPlaying} setPosInSong={setPosInSong} setCenterContent={changeCenterContent} centerContent={centerContent} isMobile={isMobile} ref={player}/>
        </>
        }
        {isSignedIn!='true' && isOnline &&
          <Login setSignedIn={setIsSignedIn} signedInState={isSignedIn} setOnline={setIsOnline} onlineState={isOnline}/>
        }
        
        
      </header>
    </div>
  );
}

export default App;

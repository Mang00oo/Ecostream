import axios from 'axios';
import { AutoTextSize } from 'auto-text-size';
import * as serverApi from '../apis/server-api';
import { FaPlay, FaPlus, FaDownload } from "react-icons/fa6";
import { BiEqualizer } from "react-icons/bi";
import { HiMiniSparkles } from "react-icons/hi2";
import { gsap } from "gsap";
import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function CreateSearchItem({ songName, artistName, imageUrl, songUrl, mbid, albumName, addCallback, playCallback }) {
  const artistUrl = songUrl.substring(0, songUrl.lastIndexOf('/_/'));
  function handleClick() {
    addCallback(songName, artistName, imageUrl, mbid, albumName);
  }
  return (
    <div className="search-item">
      <img src={imageUrl} onerror="this.onerror=null; this.src='https://placehold.co/300x300?text=No+Image';" alt="Song Image"></img>
      <div className="song-details">
        <a className="SongName" href={songUrl}>
          <AutoTextSize className="SongName" maxFontSizePx={160} mode="oneline">
            {songName}
          </AutoTextSize>
        </a>
        <a className="ArtistName" href={artistUrl}><h4 className="ArtistName"> {artistName} </h4></a>
      </div>
      <button className="AddButton" onClick={handleClick}> + </button>
    </div>
  );
}
export function CreateLibraryItem({ playlist, callback }) {
  const songCount = playlist.songs?.length ?? 0;
  const name = playlist.name;
  const [image, setImage] = useState('');
  useEffect(()=> {
    if (playlist.artworkPath) {
      serverApi.getImageUrl(playlist.artworkPath, setImage);
    } else {
      setImage('https://placehold.co/300x300?text=' + name);
    }
  }, []);
  const handleClick = () => {
    callback(playlist);
  }
  return (
    <motion.div className="library-item" onClick={handleClick} whileHover={{ scale: 1.05 }}>
      <img src={image} alt="Playlist Image"></img>
      <h3> {playlist.name} </h3>
      <p> {songCount} songs</p>
    </motion.div>
  )
}

export function CreateSongItem({ song, playCallback, isCurrent }) {
  const [image, setImage] = useState('');
  function handleClick() {
    console.log(song);
    if (song.isSearch || song.songPath.endsWith('.mp3')) {
      playCallback(song);
    }
  }
  useEffect(()=> {
    serverApi.getImageUrl(song.artworkPath, setImage);
  }, [])
  return (
    <AnimatePresence>
      <motion.div className="search-item" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.3 }}>
        <img src={image} alt="Song Image"></img>
        <div className="song-details">
          <AutoTextSize className={isCurrent? "SongName PlayingText" :"SongName"} maxFontSizePx={160} mode="oneline">
            {song.isCache && <HiMiniSparkles/>}
            {song.title}
          </AutoTextSize>
          <h4 className="ArtistName"> {song.artist} </h4>
        </div>
        <button className="PlayButton" onClick={handleClick}> {song.isSearch ? <FaPlus /> : isCurrent ? <BiEqualizer /> : song.songPath.endsWith('.mp3') ? <FaPlay /> : <FaDownload />} </button>
      </motion.div>
    </AnimatePresence>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import './AudioPlayer.css';
import * as serverApi from '../apis/server-api';
import * as nativeApi from '../apis/native-api'
import { NativeAudio } from '@capgo/capacitor-native-audio';
import { MediaSession } from '@capgo/capacitor-media-session';
import { FaPlay, FaPause, FaMicrophone } from 'react-icons/fa6';
import { IoPlaySkipBack, IoPlaySkipForward } from "react-icons/io5";
import { HiMiniQueueList } from "react-icons/hi2";
import { AudioHeadless } from "audiotoolheadless";
import { motion } from "motion/react"

if (nativeApi.getPlatform() != 'Web') {
    await NativeAudio.configure({
        backgroundPlayback: true,
        focus: true,
    });
}

const Player = ({song, setSong, setPosInSong, setCenterContent, isMobile}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [nextSong, setNextSong] = useState({});
    const [duration, setDuration] = useState(0);
    const [pos, setPos] = useState(0);
    const playerRef = useRef(null);

    function updateMetadata(_song) {
        MediaSession.setMetadata({
            title: _song.title,
            artist: _song.artist,
            artwork: [{
                src: serverApi.getMediaUrl() + _song.artworkPath,
                sizes: "300x300",
                type: "image/jpeg",
            }]
        });
    }

    function togglePlayback(target) {
        if (!target) {
            MediaSession.setPlaybackState({playbackState: 'paused'});
            playerRef.current.pause();
            setIsPlaying(false);
        } else {
            MediaSession.setPlaybackState({playbackState: 'playing'});
            playerRef.current.play();
            playerRef.current.initialize({
                mode: 'VANILLA',
                useDefaultEventListeners: true,
                enableHls: false,           // Enable HLS streaming support
                enableEqualizer: false,     // Enable 10-band equalizer
                showNotificationActions: false, // OS-level media controls
                autoPlay: true,
                preloadStrategy: 'auto',
            });
            setIsPlaying(true);
        }
    }

    async function skipSong() {
        let songToPlay;
        if (!nextSong.title) {
            const response = await serverApi.controlQueue('next');
            setSong(response);
            songToPlay = response;
        } else {
            songToPlay = nextSong;
            setSong(nextSong);
        }
        
        // Play Song
        await playerRef.current.stop();
        await playerRef.current.loadAndPlay({
            id: songToPlay._id,
            title: songToPlay.title,
            source: serverApi.getMediaUrl()+songToPlay.songPath,
            artwork: null,
        });
        await playerRef.current.play();

        updateMetadata(songToPlay);
        setIsPlaying(true);
        if (nextSong.title) {
            const response = await serverApi.controlQueue('next');
        }
        const response2 = await serverApi.getNextPlaying();
        setNextSong(response2);
        serverApi.startPlayingOnAllClients();
    }
    async function prevSong() {
        setNextSong(song);

        const response = await serverApi.controlQueue('prev');
        setSong(response);
        
        // Play Song
        await playerRef.current.stop();
        await playerRef.current.loadAndPlay({
            id: response._id,
            title: response.title,
            source: serverApi.getMediaUrl()+response.songPath,
            artwork: null,
        });
        await playerRef.current.play();

        updateMetadata(response);
        setIsPlaying(true);
        serverApi.startPlayingOnAllClients();
    }
    function formatTime(timeInSeconds) {
        if (isNaN(timeInSeconds)) return "00:00";
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }

    useEffect(()=> {
        updateMetadata(song);
        if (playerRef.current) {
            playerRef.current.loadTrack({
                id: song._id,
                title: song.title,
                source: serverApi.getMediaUrl()+song.songPath,
                artwork: null,
            });
        }
    }, [song._id]);

    useEffect(() => {
        MediaSession.setActionHandler({action: 'pause'}, ()=> {togglePlayback(false)});
        MediaSession.setActionHandler({action: 'play'}, ()=> {togglePlayback(true)});
        MediaSession.setActionHandler({action: 'nexttrack'}, ()=> {skipSong()});
        MediaSession.setActionHandler({action: 'previoustrack'}, ()=> {prevSong()});
        
        if (playerRef.current != null) return;
        const player = new AudioHeadless();
        playerRef.current = player;
        player.initialize({
            mode: 'VANILLA',
            useDefaultEventListeners: true,
            enableHls: false,           // Enable HLS streaming support
            enableEqualizer: false,     // Enable 10-band equalizer
            showNotificationActions: false, // OS-level media controls
            autoPlay: false,
            preloadStrategy: 'auto',
        });
        player.addEventListener("timeupdate", (e) => {
            if (e.target.duration) {
                setPosInSong(e.target.currentTime);
                MediaSession.setPositionState({position: e.target.currentTime, duration: e.target.duration});
                setDuration(e.target.duration);
                setPos(e.target.currentTime);
            }
        });
        player.addEventListener("canplay", (e) => {
            setDuration(e.target.duration);
        });
        player.addEventListener("ended", ()=> {
            skipSong();
        });

        MediaSession.setActionHandler({action: 'seekto'}, (e)=> {
            player.seekToTime(e.seekTime);
        });

        updateMetadata(song);
    }, [])
    return(
        <div className="audio-player" onClick={()=>{if(isMobile) setCenterContent('none')}} style={{bottom: isMobile?"77px":"10px"}}>
            <div className="player-details">
                <img src={serverApi.getMediaUrl() + song.artworkPath} className="player-image" crossOrigin="anonymous"></img>
                <div className="player-details-text">
                    <h3>{song.title}</h3>
                    <p>{song.artist}</p>
                </div>
            </div>
            
            <div className="player-controls">
                <div className="player-buttons-container">
                    <motion.button className="PlayButton" onClick={prevSong} whileHover={{ scale: 1.1 }} > <IoPlaySkipBack /> </motion.button>
                    <motion.button className="PlayButton" onClick={()=>togglePlayback(!isPlaying)} whileHover={{ scale: 1.1 }} > {isPlaying ? <FaPause /> : <FaPlay />} </motion.button>
                    <motion.button className="PlayButton" onClick={skipSong} whileHover={{ scale: 1.1 }} > <IoPlaySkipForward /> </motion.button>
                </div>
                <div className="player-seek">
                    <span>{formatTime(pos)}</span>
                    <input 
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={pos}
                        onChange={(e)=>{
                            const newTime = Number(e.target.value);
                            setPos(newTime);
                            if (playerRef.current != null) {
                                playerRef.current.seekToTime(newTime);
                            }
                        }}
                        className="player-posSeek"
                    ></input>
                    <span>{formatTime(duration)}</span>
                </div>
                
            </div>
            <div className="player-navigation-container">
                <motion.button className="PlayButton" onClick={() => setCenterContent('queue')} whileHover={{ scale: 1.1 }}>
                        <HiMiniQueueList />
                </motion.button>
                <motion.button className="PlayButton" onClick={() => {setCenterContent('lyrics');}} whileHover={{ scale: 1.1 }}>
                    <FaMicrophone />
                </motion.button>
            </div>
            
        </div>
    );
}

export default Player;
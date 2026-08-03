import React, { useState, useEffect, useRef } from 'react';
import './AudioPlayer.css';
import * as serverApi from '../apis/server-api';
import * as nativeApi from '../apis/native-api'
import { NativeAudio } from '@capgo/capacitor-native-audio';
import { MediaSession } from '@capgo/capacitor-media-session';
import { FaPlay, FaPause, FaMicrophone } from 'react-icons/fa6';
import { IoPlaySkipBack, IoPlaySkipForward } from "react-icons/io5";
import { HiMiniQueueList } from "react-icons/hi2";
import { MdConnectedTv } from "react-icons/md";
import { AudioHeadless } from "audiotoolheadless";
import { motion } from "motion/react"

const Player = ({song, setSong, setPosInSong, setCenterContent, isMobile}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [nextSong, setNextSong] = useState({});
    const [duration, setDuration] = useState(0);
    const [lastPos, setLastPos] = useState(0);
    const [pos, setPos] = useState(0);
    const playerRef = useRef(null);
    const seekbarRef = useRef(null);

    function updateMetadata(_song) {
        MediaSession.setMetadata({
            title: _song.title,
            artist: _song.artist,
            artwork: [{
                src: serverApi.getImageUrl(_song.artworkPath),
                sizes: "300x300",
                type: "image/jpeg",
            }]
        });
    }

    async function togglePlayback(target, isServer = false) {
        if (!target) {
            MediaSession.setPlaybackState({playbackState: 'paused'});
            await new Promise(resolve => setTimeout(resolve, 50));

            playerRef.current.pause();
            setIsPlaying(false);
        } else {
            MediaSession.setPlaybackState({playbackState: 'playing'});
            await new Promise(resolve => setTimeout(resolve, 50));
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            await ctx.resume();
            if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
                console.log("RESUMING AUDIO CONTEXT");
                await ctx.resume();
            }
            
            window.dispatchEvent(new Event('mediaplay'));
            await playerRef.current.play();
            await playerRef.current.initialize({
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
        if (!isServer) serverApi.setPlaybackOnAllClients(target, AudioHeadless.getAudioElement().currentTime);
    }

    async function skipSong() {
        let songToPlay;
        if (!nextSong.title) {
            const response = await serverApi.controlQueue('next');
            setSong(response);
            serverApi.updateSongOnAllClients(response);
            songToPlay = response;
        } else {
            songToPlay = nextSong;
            setSong(nextSong);
            serverApi.updateSongOnAllClients(nextSong);
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
        if (response2.songPath && response2.songPath.endsWith('.mp3')) {
            setNextSong(response2);
        } else {
            setNextSong({});
        }
        serverApi.setPlaybackOnAllClients(true, 0);
    }
    async function prevSong() {
        setNextSong({});

        const response = await serverApi.controlQueue('prev');
        setSong(response);
        serverApi.updateSongOnAllClients(response);
        
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
        serverApi.setPlaybackOnAllClients(true, 0);
    }
    function formatTime(timeInSeconds) {
        if (isNaN(timeInSeconds)) return "00:00";
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    function updateSeekbarGradient() {
        if (!seekbarRef) return;
        const newTime = seekbarRef.current.value;
        const min = parseInt(seekbarRef.current.min || 0);
        const max = parseInt(seekbarRef.current.max || 100);
        const percentage = ((newTime - min) / (max - min)) * 100;
        seekbarRef.current.style.background = `linear-gradient(to right, #ffffff 0%, #ffffff ${percentage}%, #ffffff3e ${percentage}%, #ffffff3e 100%)`;
    }
    async function initSilence() {
        if (nativeApi.getPlatform() == 'Capacitor') {
            await NativeAudio.configure({
                backgroundPlayback: true,
                focus: true,
            });
        }
        await NativeAudio.preload({
            assetId: 'silence_token',
            assetPath: 'silence.mp3',
            isUrl: false
        });
        
        //await NativeAudio.play({ assetId: 'silence_token' });
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
        MediaSession.setActionHandler({action: 'pause'}, ()=> {togglePlayback(false); });
        MediaSession.setActionHandler({action: 'play'}, ()=> {togglePlayback(true); });
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
                updateSeekbarGradient();
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
            setPos(e.seekTime);
            serverApi.setPlaybackOnAllClients(playerRef.current.getCurrentState().playbackState == 'playing', e.seekTime);
        });

        serverApi.subscribeToPlayEvent((state, seek)=>{
            togglePlayback(state, true);
            setPos(seek);
            if (playerRef.current != null) {
                playerRef.current.seekToTime(seek);
            }
            updateSeekbarGradient();
        });
        serverApi.subscribeToDevicePlaybackEvent((state)=>{
            if (state) {
                player.unmute();
            } else {
                player.mute();
            }
        });
        serverApi.subscribeToUpdateSongEvent(async (song) => {
            setSong(song);
            const response2 = await serverApi.getNextPlaying();
            setNextSong(response2);
        });

        initSilence();

        //updateMetadata(song);
    }, [])
    return(
        <div className="audio-player" onClick={()=>{if(isMobile) setCenterContent('none')}} style={{bottom: isMobile?"77px":"10px"}}>
            <img src={serverApi.getMediaUrl() + nextSong.artworkPath} style={{position:'absolute', height:'0px'}}></img>
            <motion.div 
                className="player-details"
                drag={isMobile? 'x' : null}
                whileDrag={{scale: 0.7, opacity: 0.8}}
                dragSnapToOrigin
                onDragEnd={(event, info)=>{
                    if (info.offset.x > 80) {
                        prevSong();
                    } else if (info.offset.x < -80) {
                        skipSong();
                    }
                }}
            >
                <img src={serverApi.getImageUrl(song.artworkPath)} className="player-image" crossOrigin="anonymous"></img>
                <div className="player-details-text">
                    <h3>{song.title}</h3>
                    <p>{song.artist}</p>
                </div>
            </motion.div>
            
            <div className="player-controls">
                <div className="player-buttons-container" style={isMobile? {position: 'absolute', top: '25px', right: '15px'} : {}}>
                    {!isMobile &&
                        <motion.button className="PlayButton" onClick={prevSong} whileHover={{ scale: 1.1 }} > <IoPlaySkipBack /> </motion.button>
                    }
                    <motion.button className="PlayButton" onClick={()=>togglePlayback(!isPlaying)} whileHover={{ scale: 1.1 }} > {isPlaying ? <FaPause /> : <FaPlay />} </motion.button>
                    {!isMobile &&
                        <motion.button className="PlayButton" onClick={skipSong} whileHover={{ scale: 1.1 }} > <IoPlaySkipForward /> </motion.button>
                    }
                    
                </div>
                <div className="player-seek">
                    {!isMobile && 
                        <span>{formatTime(pos)}</span>
                    }
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
                            updateSeekbarGradient();
                            serverApi.setPlaybackOnAllClients(isPlaying, newTime);
                        }}
                        className={isMobile? "player-seek-mobile" : "player-seek-desktop"}
                        ref={seekbarRef}
                    ></input>
                    {!isMobile &&
                        <span>{formatTime(duration)}</span>
                    }
                </div>
            </div>
            {!isMobile &&
                <div className="player-navigation-container">
                    <motion.button className="PlayButton" onClick={() => setCenterContent('queue')} whileHover={{ scale: 1.1 }}>
                            <HiMiniQueueList />
                    </motion.button>
                    <motion.button className="PlayButton" onClick={() => {setCenterContent('lyrics');}} whileHover={{ scale: 1.1 }}>
                        <FaMicrophone />
                    </motion.button>
                    <motion.button className="PlayButton" onClick={() => {setCenterContent('devices');}} whileHover={{ scale: 1.1 }}>
                        <MdConnectedTv />
                    </motion.button>
                </div>
            }
            
        </div>
    );
}

export default Player;
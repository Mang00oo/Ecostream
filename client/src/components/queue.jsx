import React, { useState, useEffect, useRef } from 'react';
import { Panel } from "react-resizable-panels";
import * as serverApi from '../apis/server-api';
import * as queueApi from '../apis/queue-api';
import { FaPlus, FaPlay, FaShuffle, FaAngleLeft } from "react-icons/fa6";
import { HiMiniSparkles } from "react-icons/hi2";
import * as ListItemCreator from './list-items';

const Queue = ({playCallback, reverseCenterContent, currentSong}) => {
    const [songs, setSongs] = useState({});
    const [pos, setPos] = useState(0);
    const containerRef = useRef(null);

    const playSong = async (song) => {
        const response = await queueApi.playSong(song._id);
        playCallback(response);
    }
    async function updateNowPlaying() {
        if (!containerRef.current) return;
        const currentIndex = await queueApi.getQueuePos();
        setPos(currentIndex);
        const currentLine = containerRef.current.children[currentIndex];
        if (currentLine) {
            currentLine.scrollIntoView({ behavior: 'smooth', block: 'center',  });
        }
    }
    useEffect(()=> {
        const updateSongs = async() => {
            const response = await queueApi.getQueue();
            setSongs(response);
            updateNowPlaying();
        }
        updateSongs();
    }, []);
    useEffect(() => {
        updateNowPlaying();
    }, [currentSong._id]);
    return(
        <Panel defaultSize={40} minSize={'40%'} className="panel">
            <h2>Queue</h2>
            <button className="CenterCloseButton" onClick={reverseCenterContent}>
                  <FaAngleLeft /> ‎ Back
            </button>
            <div ref={containerRef}>
                {songs.length > 0 ? songs.map((song, index) => <ListItemCreator.CreateSongItem key={song._id} song={song} playCallback={playSong} isCurrent={pos === index} />) : <p> Loading Queue... </p>}
            </div>
            
        </Panel>
    )
}
export default Queue
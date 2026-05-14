import React, { useState, useEffect, useRef } from 'react';
import { Panel } from "react-resizable-panels";
import * as serverApi from '../apis/server-api';
import { FaPlus, FaPlay, FaShuffle, FaAngleLeft } from "react-icons/fa6";
import { HiMiniSparkles } from "react-icons/hi2";
import * as ListItemCreator from './list-items';

const Queue = ({playCallback, reverseCenterContent}) => {
    const [songs, setSongs] = useState({});

    const playSong = async (song) => {
        const response = await serverApi.controlQueue('play', song._id);
        playCallback(response);
    }
    useEffect(()=> {
        const updateSongs = async() => {
             const response = await serverApi.getQueue();
             setSongs(response.queue);
             console.log('Updating queue');
        }
        updateSongs();
    }, []);
    return(
        <Panel defaultSize={40} minSize={'40%'} className="panel">
            <h2>Queue</h2>
            <button className="CenterCloseButton" onClick={reverseCenterContent}>
                  <FaAngleLeft /> ‎ Back
            </button>
            {songs.length > 0 ? songs.map((song) => <ListItemCreator.CreateSongItem key={song._id} song={song} playCallback={playSong} />) : <p> Loading Queue... </p>}
        </Panel>
    )
}
export default Queue
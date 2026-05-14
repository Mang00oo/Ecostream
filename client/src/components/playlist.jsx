import React, { useState, useEffect, useRef } from 'react';
import { Panel } from "react-resizable-panels";
import * as serverApi from '../apis/server-api';
import { FaPlus, FaPlay, FaShuffle } from "react-icons/fa6";
import { HiMiniSparkles } from "react-icons/hi2";
import { IoClose } from "react-icons/io5";
import * as ListItemCreator from './list-items';

const Playlist = ({data, playCallback, setCenterContent}) => {
    const [songs, setSongs] = useState({});
    const [selectedShuffleOption, setSelectedShuffleOption] = useState('No Shuffle');

    const playSong = async (song) => {
        const response = await serverApi.controlQueue('play', song._id);
        await playCallback(response);
    }
    const playPlaylist = async () => {
        console.log(data._id)
        const shuffleType = selectedShuffleOption;
        const response = await serverApi.playPlaylist(data._id, shuffleType);
        console.log(response);
        await playCallback();
    }
    const onShuffleButtonPressed = async () => {
        if (selectedShuffleOption === 'Shuffle') { 
            setSelectedShuffleOption('Smart Shuffle');
            serverApi.setShuffle('Smart Shuffle');
        }
        if (selectedShuffleOption === 'Smart Shuffle') { 
            setSelectedShuffleOption('No Shuffle');
            serverApi.setShuffle('No Shuffle');
        }
        if (selectedShuffleOption === 'No Shuffle') { 
            setSelectedShuffleOption('Shuffle');
            serverApi.setShuffle('Shuffle');
        }
    }
    const getShuffleIcon = () => {
        if (selectedShuffleOption === 'No Shuffle') {
            return <FaPlay />;
        }
        if (selectedShuffleOption === 'Shuffle') {
            return <FaShuffle />;
        }
        if (selectedShuffleOption === 'Smart Shuffle') {
            return <HiMiniSparkles />;
        }
    }
    useEffect(()=> {
        setSongs(data.songs);
        setSelectedShuffleOption(data.shuffle || 'No Shuffle');
    }, [data]);
    return(
        <Panel defaultSize={40} minSize={'40%'} className="panel">
            <h2>Playlist</h2>
            <button className="CenterCloseButton" onClick={() => setCenterContent('none')}> <IoClose /> </button>
            <img className="playlist-image" src={data.artworkPath ? 'http://localhost:8080/media/' + data.artworkPath : 'https://placehold.co/300x300?text=' + data.name} alt="Playlist cover" />
            <div className="playlist-details">
                <h3> {data.name} </h3>
                <p> {data.songs.length} songs </p>
                <button className="PlayButton2" onClick={playPlaylist}> <FaPlay />‎ Play </button>
                <button className="PlayButton2" onClick={onShuffleButtonPressed}> {getShuffleIcon()}‎ {selectedShuffleOption} </button>
            </div>
            {songs.length > 0 ? songs.map((song) => <ListItemCreator.CreateSongItem key={song._id} song={song} playCallback={playSong} />) : <p> No songs in this playlist yet. Try adding some! </p>}
        </Panel>
    )
}
export default Playlist
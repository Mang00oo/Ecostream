import React, { useState, useEffect } from 'react';
import { Panel } from "react-resizable-panels";
import * as serverApi from '../apis/server-api';
import * as nativeApi from '../apis/native-api';
import * as offlineApi from '../apis/offline';
import * as queueApi from '../apis/queue-api';
import { FaPlay, FaShuffle, FaTrash, FaDownload } from "react-icons/fa6";
import { MdEdit } from "react-icons/md";
import { HiMiniSparkles } from "react-icons/hi2";
import { IoClose } from "react-icons/io5";
import * as ListItemCreator from './list-items';

const Playlist = ({data, playCallback, setCenterContent, editRef}) => {
    const [songs, setSongs] = useState({});
    const [image, setImage] = useState('');
    const [selectedShuffleOption, setSelectedShuffleOption] = useState('No Shuffle');

    const playSong = async (song) => {
        const response = await queueApi.playSong(song._id);
        await playCallback(response);
    }
    const playPlaylist = async () => {
        console.log(data._id)
        const shuffleType = selectedShuffleOption;
        await queueApi.playPlaylist(data._id, shuffleType);
        await playCallback();
    }
    const onShuffleButtonPressed = async () => {
        const isOnline = await serverApi.getIsOnline();
        if (selectedShuffleOption === 'Shuffle') { 
            setSelectedShuffleOption(isOnline? 'Smart Shuffle' : 'No Shuffle');
            queueApi.setShuffle(data._id, isOnline? 'Smart Shuffle' : 'No Shuffle');
        }
        if (selectedShuffleOption === 'Smart Shuffle') { 
            setSelectedShuffleOption('No Shuffle');
            queueApi.setShuffle(data._id, 'No Shuffle');
        }
        if (selectedShuffleOption === 'No Shuffle') { 
            setSelectedShuffleOption('Shuffle');
            queueApi.setShuffle(data._id, 'Shuffle');
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
    function editDetails() {
        if (editRef.current) {
            editRef.current.showPopup(data);
        }
    }
    function deletePlaylist() {
        if (editRef.current) {
            editRef.current.deletePlaylist(data._id);
            setCenterContent('none');
        }
    }
    async function downloadPlaylist() {
        console.log('Beginning downloading JSON!');
        const result = await offlineApi.downloadPlaylist(data._id);
        if (result) {
            console.log('Downloaded JSON successfully!');
        }
    }
    useEffect(()=> {
        setSongs(data.songs);
        async function setShuffle() {
            const isOnline = await serverApi.getIsOnline();
            if (isOnline) {
                setSelectedShuffleOption(data.shuffle || 'No Shuffle');
            } else {
                setSelectedShuffleOption(data.shuffle == 'Smart Shuffle' ? 'Shuffle' : data.shuffle);
            }
            
        }
        setShuffle();
        if (data.artworkPath) {
            serverApi.getImageUrl(data.artworkPath, setImage);
        } else {
            setImage('https://placehold.co/300x300?text=' + data.name);
        }
    }, [data]);
    return(
        <Panel defaultSize={40} minSize={'40%'} className="panel">
            <img className="playlist-image" src={image} alt="Playlist cover" />
            <div className="playlist-details">
                <h3 onClick={editDetails} className="clickable"> {data.name} </h3>
                
                <p> {data.songs.length} songs </p>
                <span>
                    <button className="PlayButton2" onClick={playPlaylist} style={{marginRight: 5}}> <FaPlay />‎ Play </button>
                    <button className="PlayButton2" onClick={editDetails} style={{marginRight: 5}}> <MdEdit /> </button>
                    <button className="PlayButton2" onClick={deletePlaylist} style={{marginRight: 5}}> <FaTrash /> </button>
                </span>
                
                <span>
                    {nativeApi.getPlatform() === 'Capacitor' && <button className="PlayButton2" onClick={downloadPlaylist} style={{marginRight: 5}}> <FaDownload /> </button>}
                    <button className="PlayButton2" onClick={onShuffleButtonPressed}> {getShuffleIcon()}‎ {selectedShuffleOption} </button>
                </span>
                
            </div>
            {songs.length > 0 ? songs.map((song) => <ListItemCreator.CreateSongItem key={song._id} song={song} playCallback={playSong} />) : <p> No songs in this playlist yet. Try adding some! </p>}
        </Panel>
    )
}
export default Playlist
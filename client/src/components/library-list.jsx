import React, { useState, useEffect, useRef } from 'react';
import { Panel } from "react-resizable-panels";
import * as serverApi from '../apis/server-api';
import { FaPlus } from "react-icons/fa6";
import * as ListItemCreator from './list-items';
import { gsap } from "gsap";

const LibraryList = ({currentData, centerContent, setData, refreshTrigger, editRef}) => {
    const [libraryItems, setLibraryItems] = useState([]);
    const handleLibraryClick = (playlist) => {
        console.log('Clicked playlist: ' + playlist.name);
        setData(playlist);
        centerContent('playlist');
    }
    const createPlaylist = async() => {
        if (editRef.current) {
            editRef.current.showPopup();
        }
    }
    const loadPlaylists = async () => {
        const data = await serverApi.getLibrary();
        setLibraryItems(data);
        return data;
    };
    useEffect(() => {
        async function update() {
            const playlists = await loadPlaylists();

            if (currentData._id) {
                const result = playlists.find(playlist => playlist._id === currentData._id);
                setData(result);
            }
        }
        update();
    }, [refreshTrigger]);

    return (
        <Panel defaultSize={30} minSize={'30%'} className="panel" collapsible={true}>
            <h2>Library</h2> 

            {libraryItems.length > 0 ? libraryItems.map((playlist) => <ListItemCreator.CreateLibraryItem key={playlist._id || playlist.name} playlist={playlist} callback={handleLibraryClick} />) : <p> No playlists yet. Try creating one! </p>}
        
            <button className="NewPlaylistButton" onClick={createPlaylist}> <FaPlus /> New Playlist </button>
        </Panel>
    );
}

export default LibraryList;
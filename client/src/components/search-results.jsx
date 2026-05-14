import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Panel } from "react-resizable-panels";
import * as serverApi from '../apis/server-api';
import { FaPlus } from "react-icons/fa6";
import * as ListItemCreator from './list-items';
import { FaPlay } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import * as lastfm from '../apis/last-fm';
import AddToPlaylistPopup from './add-to-playlist-popup';

const SearchResults = forwardRef(({searchQuery, onLibraryUpdated, setCenterContent}, ref) => {
    const [songs, setSongs] = useState([]);
    const [addSong, setAddSong] = useState({});

    const performSearch = async () => {
        setSongs([]);
        if (!searchQuery || !searchQuery.trim()) {
            return;
        }

        const tracks = await lastfm.searchLastFM(searchQuery);
        console.log(tracks);
        const results = [];

        for (const track of tracks) {
            const info = await lastfm.getTrackInfo(track.name, track.artist);
            const _songName = track.name;
            const _artistName = track.artist;
            const _mbid = track.mbid;
            let _albumName = info && info.album ? info.album.title : _songName;
            let _imageUrl = 'https://placehold.co/300x300?text=No+Image';
            if (info && info.album && info.album.image && info.album.image[3] && info.album.image[3]['#text']) {
                _imageUrl = info.album.image[3]['#text'];
            }
            const _songUrl = track.url;
            results.push({title: _songName, artist: _artistName, artworkPath: _imageUrl, albumName: _albumName, isSearch: true});
            setSongs([...results]);
        }
    };

    useImperativeHandle(ref, () => ({
        performSearch,
    }), [performSearch]);

    useEffect(() => {
        performSearch();
    }, [searchQuery]);

    const addSongPlaylist = (song) => {
        setAddSong(song);
    };

    return(
        <Panel defaultSize={40} minSize={'40%'} className="panel">
            <h2>Search Results</h2>
            <button className="CenterCloseButton" onClick={() => setCenterContent('none')}> <IoClose /> </button>
            <AddToPlaylistPopup song={addSong} setSong={setAddSong} refreshLibrary={onLibraryUpdated}></AddToPlaylistPopup>
            {songs.length > 0 && songs.map((song, idx) => <ListItemCreator.CreateSongItem key={`${song.title}-${song.artist}-${idx}`} song={song} playCallback={addSongPlaylist} />)}
        </Panel>
    )
})
export default SearchResults
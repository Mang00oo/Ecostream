import React from 'react';
import { useState, useEffect } from 'react';
import { Panel } from "react-resizable-panels";
import * as serverApi from '../apis/server-api';
import { useMediaMeta } from 'use-media-session';
import { HiMiniQueueList } from "react-icons/hi2";
import { FaMicrophone } from "react-icons/fa6";import { Client } from 'lrclib-api';

const client = new Client();

const NowPlaying = ({ song, setCenterContent }) => {
      useMediaMeta({
            title: song.title,
            artist: song.artist,
            artwork: [
                  { src: serverApi.getMediaUrl() + song.artworkPath, sizes: '300x300', type: 'image/jpeg' }
            ]
      });
      return (
            <Panel defaultSize={30} minSize={'12%'} className="panel" collapsible={true}>
                  <h2> Now Playing </h2>
                  <img className="now-playing-image" src={!song.isStream ? serverApi.getMediaUrl() + song.artworkPath : song.artworkPath} alt="Song cover" />
                  <h3> {song.title} </h3>
                  <p> {song.artist} </p>
                  <button className="PlayButton2" onClick={() => setCenterContent('queue')}>
                        <HiMiniQueueList /> ‎ Queue
                  </button>
                  <button className="PlayButton2" onClick={() => {setCenterContent('lyrics');}}>
                        <FaMicrophone /> ‎ Lyrics
                  </button>
            </Panel>    
      );
}

export default NowPlaying;
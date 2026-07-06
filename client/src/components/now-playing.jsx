import React from 'react';
import { Panel } from "react-resizable-panels";
import * as serverApi from '../apis/server-api';

const NowPlaying = ({ song }) => {
      return (
            <Panel defaultSize={30} minSize={'12%'} className="panel" collapsible={true}>
                  <img className="now-playing-image" src={!song.isStream ? serverApi.getMediaUrl() + song.artworkPath : song.artworkPath} alt="Song cover" />
                  <h3> {song.title} </h3>
                  <p> {song.artist} </p>
            </Panel>    
      );
}

export default NowPlaying;
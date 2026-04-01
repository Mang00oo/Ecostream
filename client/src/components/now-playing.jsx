import React from 'react';
import { Panel } from "react-resizable-panels";

const NowPlaying = ({ song }) => {
      return (
            <Panel defaultSize={30} minSize={'12%'} className="panel" collapsible={true}>
                  <h2> Now Playing </h2>
                  <img className="now-playing-image" src={'http://localhost:8080/media/'+song.artworkPath} alt="Song cover" />
                  <h3> {song.title} </h3>
                  <p> {song.artist} </p>
            </Panel>    
      );
}

export default NowPlaying;
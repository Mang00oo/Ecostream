import React from 'react';
import { Panel } from "react-resizable-panels";
import * as serverApi from '../apis/server-api';
import { motion } from 'motion/react';
import { FaMicrophone } from 'react-icons/fa6';
import { HiMiniQueueList } from "react-icons/hi2";

const NowPlaying = ({ song, isMobile, setCenterContent }) => {
      return (
            <Panel defaultSize={30} minSize={'12%'} className="panel" collapsible={true}>
                  <img className="now-playing-image" src={!song.isStream ? serverApi.getMediaUrl() + song.artworkPath : song.artworkPath} alt="Song cover" />
                  <h3> {song.title} </h3>
                  <p> {song.artist} </p>
                  {isMobile &&
                  <>
                  <motion.button className="PlayButton2" onClick={() => setCenterContent('queue')} whileHover={{ scale: 1.1 }}>
                        <HiMiniQueueList /> ‎ Queue
                  </motion.button>
                  <motion.button className="PlayButton2" onClick={() => {setCenterContent('lyrics');}} whileHover={{ scale: 1.1 }}>
                        <FaMicrophone /> ‎ Lyrics
                  </motion.button>
                  </>
                  }
            </Panel>    
      );
}

export default NowPlaying;
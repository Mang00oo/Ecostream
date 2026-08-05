import React, { useState, useEffect } from 'react';
import { Panel } from "react-resizable-panels";
import * as serverApi from '../apis/server-api';
import { motion } from 'motion/react';
import { FaMicrophone, FaPlus, FaCheck } from 'react-icons/fa6';
import { IoClose } from "react-icons/io5";
import { HiMiniQueueList } from "react-icons/hi2";
import { MdConnectedTv } from "react-icons/md";
import { AiOutlineLoading } from "react-icons/ai";

const NowPlaying = ({ song, isMobile, setCenterContent, onLibraryUpdated }) => {
      const [addState, setAddState] = useState('add');
      const [image, setImage] = useState('');
      async function add() {
            if (addState === 'added') return;
            setAddState('adding')
            const result = await serverApi.addToPlaylist(null, song._id);
            setAddState(result ? 'added' : 'failed');
            onLibraryUpdated();
      }
      useEffect(()=> {
            setAddState('add');
            serverApi.getImageUrl(song.artworkPath, setImage);
      }, [song.title])
      return (
            <Panel defaultSize={30} minSize={'12%'} className="panel" collapsible={true}>
                  <img className="now-playing-image" src={image} alt="Song cover" />
                  <h3> {song.title} </h3>
                  <p> {song.artist} </p>
                  {song.isCache &&
                        <motion.button className="PlayButton2" onClick={add} whileHover={{ scale: 1.1 }}>
                              {addState === 'add' &&
                                    <>
                                          <FaPlus /> ‎ Add To Playlist
                                    </>
                              }
                              {addState === 'adding' &&
                                    <>
                                          <AiOutlineLoading className="spinner-icon" /> ‎ Adding...
                                    </>
                              }
                              {addState === 'added' &&
                                    <>
                                          <FaCheck /> ‎ Added!
                                    </>
                              }
                              {addState === 'failed' &&
                                    <>
                                          <IoClose /> ‎ Failed to add.
                                    </>
                              }
                              
                        
                        </motion.button>
                  }
                  
                  {isMobile &&
                  <>
                  <motion.button className="PlayButton2" onClick={() => setCenterContent('queue')} whileHover={{ scale: 1.1 }}>
                        <HiMiniQueueList /> ‎ Queue
                  </motion.button>
                  <motion.button className="PlayButton2" onClick={() => {setCenterContent('lyrics');}} whileHover={{ scale: 1.1 }}>
                        <FaMicrophone /> ‎ Lyrics
                  </motion.button>
                  <motion.button className="PlayButton2" onClick={() => {setCenterContent('devices');}} whileHover={{ scale: 1.1 }}>
                        <MdConnectedTv /> ‎ Devices
                  </motion.button>
                  </>
                  }
            </Panel>    
      );
}

export default NowPlaying;
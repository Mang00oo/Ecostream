import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Panel } from "react-resizable-panels";
import { Client } from 'lrclib-api';
import { FaPlay } from "react-icons/fa6";
import { motion } from "motion/react";

const client = new Client();

const Lyrics = ({song, setCenterContent, posInSong}) => {
    const [lastSong, setLastSong] = useState({});
    const [lyrics, setLyrics] = useState({});
    const [lastScrollTime, setLastScrollTime] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const containerRef = useRef(null);
    useEffect(() => {
        if (song.title) {
            if (song.title !== lastSong.title || song.artist !== lastSong.artist) {
                setLyrics({});
                async function fetchLyrics() {
                    console.log('Fetching lyrics');
                    const query = {
                            track_name: song.title,
                            artist_name: song.artist,
                    };
                    const lyrics = await client.getSynced(query);
                    console.log(lyrics);
                    if (lyrics == null) {
                        setLyrics({text: "No lyrics found", startTime: 0});
                    } else {
                        setLyrics(lyrics);
                    }
                }
                fetchLyrics();
                setLastSong(song);
            }
        }
    }, [song._id]);
    useEffect(() => {
        const difference = lastScrollTime + 4000 - Date.now();
        if (lyrics[0] && difference < 0) {
            const _currentIndex = lyrics.findIndex(line => line.startTime > posInSong) - 1;
            setCurrentIndex(_currentIndex);
            const currentLine = containerRef.current.children[_currentIndex];
            if (currentLine) {
                currentLine.scrollIntoView({ behavior: 'smooth', block: 'center',  });
            }
        } else {
            setCurrentIndex(-1);
        }
    }, [posInSong]);

    const handleScroll = (e) => {
        const now = Date.now();
        setLastScrollTime(now);
    };
    return (
        <Panel defaultSize={30} minSize={'12%'} className="panel" collapsible={true}>
            <h2> Lyrics </h2>
            <button className="CenterCloseButton" onClick={() => setCenterContent('none')}> X </button>
            <div className="lyrics-container" ref={containerRef} onWheel={handleScroll} onTouchMove={handleScroll} onScroll={handleScroll}>
                {lyrics[0] ? lyrics.map((line, index) => 
                <motion.p
                    key={index}
                    className="Lyrics"
                    animate= {{
                        scale: currentIndex == -1 ? 1 : Math.max(0.4, 1-(Math.abs(currentIndex-index)/6))
                    }}
                    transition={{
                        duration: 0.8,
                        ease: [0, 0.71, 0.2, 1.01],
                    }}
                    >
                
                    {line.startTime < posInSong && posInSong < lyrics[index + 1]?.startTime && <FaPlay />} {line.text} 
                </motion.p>) : 
                    <p className="Lyrics"> Loading Lyrics... </p>
                }
            </div>
        </Panel>
    )
}
export default Lyrics;
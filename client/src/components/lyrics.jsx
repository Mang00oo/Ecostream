import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Panel } from "react-resizable-panels";
import { Client } from 'lrclib-api';
import { FaPlay } from "react-icons/fa6";

const client = new Client();

const Lyrics = ({song, setCenterContent, posInSong}) => {
    const [lastSong, setLastSong] = useState({});
    const [lyrics, setLyrics] = useState({});
    const [lastScrollTime, setLastScrollTime] = useState(0);
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
    }, [song]);
    useEffect(() => {
        const difference = lastScrollTime + 4000 - Date.now();
        if (lyrics[0] && difference < 0) {
            const currentIndex = lyrics.findIndex(line => line.startTime > posInSong) - 1;
            const currentLine = containerRef.current.children[currentIndex];
            if (currentLine) {
                currentLine.scrollIntoView({ behavior: 'smooth', block: 'center',  });
            }
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
                <p key={index} className={line.current ? 'current-lyric' : ''}> {line.startTime < posInSong && posInSong < lyrics[index + 1]?.startTime && <FaPlay />} {line.text} </p>) : 
                    <p> Loading Lyrics... </p>
                }
            </div>
        </Panel>
    )
}
export default Lyrics;
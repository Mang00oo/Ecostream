import React from 'react';

const NowPlaying = ({ song }) => {
      return (
            <div className="now-playing">
                  <h2> Now Playing </h2>
                  <img src={'http://192.168.0.82:8080/media/'+song.artworkPath} alt="Song cover" />
                  <h3> {song.title} </h3>
                  <a href="https://google.com"> {song.artist} </a>
            </div>
      );
}

export default NowPlaying;
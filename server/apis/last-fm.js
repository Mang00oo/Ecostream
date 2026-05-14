const axios = require('axios');

const apiKey = '5b2cd6941325c489a8bcf9477a574eaf';

module.exports = {
    getSimilarTracks: async function(artistName, trackName) {
        const url = `http://ws.audioscrobbler.com/2.0/?method=track.getsimilar&artist=${encodeURIComponent(artistName)}&track=${encodeURIComponent(trackName)}&api_key=${apiKey}&format=json`;
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Ecostream/1.0 ( mang0o@mang0o.com )',
                },
            });
            return response.data.similartracks.track;
        } catch (error) {
            console.error('Error fetching similar songs from Last.fm:', error);
            return [];
        }
    },
    getTrackInfo: async function(artistName, trackName) {
        const url = `http://ws.audioscrobbler.com/2.0/?method=track.getinfo&track=${encodeURIComponent(trackName)}&artist=${encodeURIComponent(artistName)}&api_key=${apiKey}&format=json`;
        try {
            const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Ecostream/1.0 ( mang0o@mang0o.com )',
            },
            });
            return response.data.track;
        } catch (error) {
            console.error('Error fetching track info from Last.fm:', error);
            return null;
        }
    }
};
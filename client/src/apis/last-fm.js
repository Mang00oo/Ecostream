import axios from 'axios';

const apiKey = '5b2cd6941325c489a8bcf9477a574eaf';

export async function searchLastFM(query) {
  const url = `http://ws.audioscrobbler.com/2.0/?method=track.search&track=${encodeURIComponent(query)}&api_key=${apiKey}&format=json`;

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Ecostream/1.0 ( mang0o@mang0o.com )',
      },
    });
    return response.data.results.trackmatches.track;
  } catch (error) {
    console.error('Error fetching from Last.fm:', error);
    return [];
  }
}
export async function getTrackInfo(trackID) {
  const url = `http://ws.audioscrobbler.com/2.0/?method=track.getinfo&mbid=${trackID}&api_key=${apiKey}&format=json`;

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
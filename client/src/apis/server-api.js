import axios from 'axios';

const SERVER_API_URL = 'http://localhost:8080/';

export async function getPlaylists() {
    const response = await axios.get(SERVER_API_URL + 'api/get_library');
    return response.data;
}
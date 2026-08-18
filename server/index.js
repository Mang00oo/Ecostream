const express = require('express');
const { createServer } = require("http");
const cron = require('node-cron');
const app = express();
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const mongoose = require('mongoose');
const router = express.Router();
const muse = require('libmuse');
const Song = require('./models/Song');
const User = require('./models/User');
const Playlist = require('./models/playlist');
const axios = require('axios');
const { Server } = require("socket.io");
const lastfm = require('./apis/last-fm');
require('dotenv').config({path: path.join(__dirname, 'credentials.env')});
const jwt = require('jsonwebtoken');

// node index.js to run backend
const uri = process.env.MONGOOSE_URI;
const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

const allowedOrigins = [
      'https://ecostream.local',
      'http://localhost',          // Android Capacitor app origin
      'capacitor://localhost',    // iOS Capacitor app origin
      'file://',
      'http://100.90.153.39:8080',
];
app.use(cors({
  origin: function (origin, callback) {
    // 1. CRITICAL: If no origin header is present (like native HTML <img> or <audio> tags), allow it!
    if (!origin) {
      return callback(null, true);
    }
    
    // 2. If it's a known native app scheme, allow it
    if (allowedOrigins.includes(origin) || origin.startsWith('capacitor-electron://')) {
      return callback(null, true);
    }
    
    // 3. FALLBACK FOR WEB APP: Accept any web client but mirror their specific origin back to them
    // This stops your browser clients and different Tailscale network IPs from crashing!
    return callback(null, true); 
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/media', express.static(path.join(__dirname, '../music'), { 
      fallthrough: false,
      setHeaders: (res, path, stat) => {
            res.set('Access-Control-Allow-Origin', '*'); 
            res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.set('Accept-Ranges', 'bytes'); 
      }
}));

const PORT = 8080;
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: {
    origin: "*",
    methods: ["GET", "POST"]
}});
let userDevices = {}
function updateDeviceList(userID) {
      let devices = []
      for (device of userDevices[userID]) {
            devices.push({id: device.socket.id, name: device.name, type: device.type, isPlaying: device.isPlaying});
      }
      for (device of userDevices[userID]) {
            io.to(device.socket.id).emit('updateDeviceList', devices)
      }
}
io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('setUser', (data) => {
      if (!userDevices[data.userID]) {
            userDevices[data.userID] = [];
      }
      socket.emit('setDevicePlayback', userDevices[data.userID].length == 0);
      userDevices[data.userID].push({
            socket: socket,
            name: data.deviceName,
            type: data.deviceType,
            isPlaying: userDevices[data.userID].length == 0,
      });
      console.log(userDevices);
      updateDeviceList(data.userID);
  });
  socket.on('togglePlay', (data) => {
    socket.broadcast.emit('togglePlay', data);
  });
  socket.on('updateSong', (data) => {
    socket.broadcast.emit('updateSong', data);
  });
  socket.on('setDevicePlaying', (data) => {
      for (const [user, devices] of Object.entries(userDevices)) {
            const index = devices.findIndex(obj => obj['socket'].id === data.id);
            if (index != -1) {
                  devices[index].isPlaying = data.isPlaying
                  updateDeviceList(user);
            };
      }
      io.to(data.id).emit('setDevicePlayback', data.isPlaying);
  });
  socket.on('ntp_ping', (clientData, callback) => {
      const t1 = Date.now();
      
      if (typeof callback === 'function') {
            const t2 = Date.now();
            callback({t1, t2});
      }
  });
  socket.on('disconnect', () => {
    console.log('user disconnected');
    for (const [user, devices] of Object.entries(userDevices)) {
      const index = devices.findIndex(obj => obj['socket'].id === socket.id);
      if (index != -1) {
            devices.splice(index, 1);
            updateDeviceList(user);
      };
    }
    console.log(userDevices);
  });
});

async function runMongoose() {
  try {
    // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
    await mongoose.connect(uri, clientOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (e) {
    console.error("Error connecting to MongoDB:", e);
  }
}
runMongoose().catch(console.dir);

async function authenticateToken(req, res, next) {
  // Extract token from 'Authorization: Bearer <TOKEN>'
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, process.env.PASSWORD, async (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    if (user.userID != 'none') {
      const dbUser = await User.findById(user.userID);
      if (user.userID != 'none' && user.password != dbUser.password) {
            return res.status(403).json({ message: 'Invalid profile password' })
      }
    }
    // Attach decoded user payload to request
    req.user = user;
    next(); // Pass control to the next handler
  });
}
app.use('/api', authenticateToken); // Apply authentication middleware to all /api routes below

app.get('/api/get_users', async (req, res) => {
      const users = await User.find();
      users.forEach(user => { if (user.password == '') {user.password = false} else {user.password = true} } );
      res.send(users);
});
app.get('/api/login_as_user', async (req, res) => {
      const _id = req.query.userID;
      const pwd = req.query.password;
      const user = await User.findById(_id);
      if (user) {
            if (user.password == pwd || (user.password || user.password=='' && pwd == '')) {
                  const newToken = jwt.sign({ userID: _id, password: pwd }, process.env.PASSWORD, { expiresIn: '7d' });
                  res.send({ success: true, token: newToken, userID: _id, password: '' });
            } else {
                  res.send({ success: false });
            }
      } else {
            res.send({ success: false });
      }
});

app.get('/auth/login', async (req, res) => {
      const token = req.query.token;
      const password = req.query.password;
      if (password) {
            if (password === process.env.PASSWORD) {
                  const newToken = jwt.sign({ userID: 'none', password: '' }, process.env.PASSWORD, { expiresIn: '7d' });
                  res.send({ success: true, token: newToken, userID: 'none', password: '' }); //69c9829852008ffbf2b60fcf
                  return;
            } else {
                  res.send({ success: false });
                  return;
            }
      } else if (token) {
            jwt.verify(token, process.env.PASSWORD, (err, decoded) => {
                  if (err) {
                        res.send('Invalid token');
                        return;
                  }
                  const newToken = jwt.sign({ userID: decoded.userID, password: decoded.password }, process.env.PASSWORD, { expiresIn: '7d' });
                  res.send({ success: true, token: newToken, userID: decoded.userID });
            });
      } else {
            res.status(400).send('Password or token required');
            return;
      }
});
function getCurrentUser(req) {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) return null;
      try {
            const decoded = jwt.verify(token, process.env.PASSWORD);
            return decoded.userID;
      } catch (err) {
            return null;
      }
}

app.get('/api/get_song', (req, res) => {
      //const mbid = req.query.mbid;
      res.send('http://localhost:8080/media/' + mbid + '.mp3');
})
app.get('/api/add_to_queue', async (req, res) => {
      const user = await User.findById(await getCurrentUser(req));
      const songId = req.query.songId;
      await user.updateOne({ $push: { queue: {$each: [songId], $position: user.posInQueue + 1}, }});
      res.send('Added to queue');
});
app.get('/api/control_queue', async (req, res) => {
      const action = req.query.action; // 'next', 'prev', or 'play'
      const song = req.query.songId; // for 'play' action
      let _song;
      const user = await User.findById(await getCurrentUser(req)).populate('queue').exec();
      if (!user) {
            res.status(404).send('User not found');
            return;
      }
      if (action === 'next') {
            if (user.posInQueue + 2 < user.queue.length && !user.queue[user.posInQueue + 2].songPath.endsWith('.mp3')) {
                  let songToDownload = user.queue[user.posInQueue + 2]
                  downloadSong(songToDownload.artist, songToDownload.title, songToDownload.artworkPath, songToDownload.title, null, user._id, songToDownload._id);
            }
            let next = Math.min(user.posInQueue + 1, user.queue.length-1);
            if (!user.queue[next].songPath.endsWith('.mp3')) {
                  next++;
            }
            user.posInQueue = Math.min(next, user.queue.length - 1);
      } else if (action === 'prev') {
            let prev = Math.max(user.posInQueue - 1, 0);
            if (!user.queue[prev].songPath.endsWith('.mp3')) {
                  prev--;
            }
            user.posInQueue = Math.max(prev, 0);
      } else if (action === 'play') {
            console.log('Playing song ID: ' + song);
            if (user.queue.some(s => s._id.toString() === song)) {
                  user.posInQueue = user.queue.findIndex(s => s._id.toString() === song);
            } else {
                 _song = await Song.findById(song);
                  user.queue.unshift(_song);
                  user.posInQueue = 0; 
            }
      }
      await user.save();
      

      const nowPlaying = user.queue[user.posInQueue];
      if (_song) {
            res.send(_song);
      } else {
            res.send(nowPlaying);
      }   
});
app.get('/api/get_queue', async (req, res) => {
      const user = await User.findById(await getCurrentUser(req)).populate('queue').exec();
      if (!user) {
            res.status(404).send('User not found');
            return;
      }
      res.send({ queue: user.queue, posInQueue: user.posInQueue, source: user.queueSource });
});
app.get('/api/get_queue_pos', async (req, res) => {
      const user = await User.findById(getCurrentUser(req));
      if (user) {
            res.send(user.posInQueue);
      }
});
const shuffleArray = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
}

const deleteSong = async (songId) => {
      const song = await Song.findById(songId);
      if (song) {
            const imageCount = await Song.countDocuments({ artworkPath: song.artworkPath });
            if (imageCount === 1 && song.artworkPath) {
                  fs.unlink(path.join(__dirname, '../music/', song.artworkPath), (err) => {
                        if (err) {
                              console.error('Error deleting artwork:', err);
                        } else {
                              console.log('Deleted artwork:', song.artworkPath);
                        }
                  });
            }
            fs.unlink(path.join(__dirname, '../music/', song.songPath), (err) => {
                  if (err) {
                        console.error('Error deleting file:', err);
                  } else {
                        console.log('Deleted file:', song.songPath);
                  }
            });
            await Song.deleteOne({ _id: songId });
      }
}
const clearCache = async () => {
      const cachedSongs = await Song.find({ isCache: true });
      for (let song of cachedSongs) {
            await deleteSong(song._id);
      }
      console.log('Cache cleared');
}
cron.schedule('0 0 * * 0', () => { // Clear cache once a week
    console.log('Clearing cache...');
    clearCache();
});

const addSmartSuggestions = async (userID) => {
      const user = await User.findById(userID).populate('queue').exec();
      let queue = user.queue;
      if (queue.length === 0) {
            return;
      }
      let pickedSuggestions = [];
      let insertCount = 0;
      const queueCopy = [...queue];
      for (let i = user.posInQueue+2; i < queueCopy.length-user.posInQueue; i+=2) {
            const actualIndex = i+insertCount;
            const song = queueCopy[i];
            const suggestions = await lastfm.getSimilarTracks(song.artist, song.title);
            for (let suggestion of suggestions) {
                  const existingSong = await Song.findOne({ title: suggestion.name, artist: suggestion.artist.name });
                  if (existingSong) { continue; } else {
                        const info = await lastfm.getTrackInfo(suggestion.artist.name, suggestion.name);
                        let _albumName = info.album ? info.album.title : suggestion.name;
                        let _imageUrl = 'https://placehold.co/300x300?text=No+Image';
                        if (info && info.album && info.album.image && info.album.image[3] && info.album.image[3]['#text']) {
                        _imageUrl = info.album.image[3]['#text'];
                        }
                        console.log('Adding smart suggestion: ' + suggestion.name + ' by ' + suggestion.artist.name);
                        
                        const newSong = new Song({
                              title: suggestion.name,
                              artist: suggestion.artist.name,
                              duration: 0,
                              songPath: "_suggestion_",
                              artworkPath: _imageUrl,
                              isCache: true
                        });
                        await newSong.save();
                        
                        console.log(newSong);
                        user.queue.splice(actualIndex, 0, newSong._id);
                        await user.save();
                        break;
                  }
            }
            insertCount++;
      }
      console.log('Smart suggestions added');
      //shuffleArray(pickedSuggestions);
      //for (let i = 0; i < pickedSuggestions.length; i++) {
      //      const index = user.posInQueue+2 + i*3;
      //      user.queue.splice(index, 0, pickedSuggestions[i]._id);
      //}
      //user.save();
}
app.get('/api/clear_cache', async (req, res) => {
      await clearCache();
      res.send('Cache cleared');
});
app.get('/api/play_playlist', async (req, res) => {
      const playlistId = req.query.playlistId;
      const shuffleType = req.query.shuffleType;
      const playlist = await Playlist.findById(playlistId).populate('songs').exec();
      if (!playlist) {
            console.log('Playlist not found: ' + playlistId);
            res.status(404).send('Playlist not found');
            return;
      }
      const user = await User.findById(getCurrentUser(req));
      if (!user) {
            res.status(404).send('User not found');
            return;
      }
      let songsToPlay = playlist.songs;
      playlist.shuffle = shuffleType;
      await playlist.save();
      if (shuffleType !== 'No Shuffle') {
            songsToPlay = shuffleArray(songsToPlay);
      }
      user.queue = songsToPlay.map(song => song._id);
      user.queueSource = { Playlist: playlist._id };
      user.posInQueue = 0;
      await user.save();
      res.send('Playlist added to queue');
      if (shuffleType === 'Smart Shuffle') {
            await addSmartSuggestions(user._id);
      }
});
app.get('/api/set_shuffle', async (req, res) => {
      const shuffleType = req.query.shuffleType;
      const id = req.query.playlistId;
      const user = await User.findById(await getCurrentUser(req)).populate('queue').populate('queueSource').exec();
      if (!user) {
            res.status(404).send('User not found');
            return;
      }
      const playlist = await Playlist.findById(id).populate('songs').exec();
      if (playlist) {
            let songsToPlay;
            const originalShuffleType = playlist.shuffle || 'No Shuffle';
            playlist.shuffle = shuffleType;
            await playlist.save();

            if (user.queueSource.Playlist && user.queueSource.Playlist == playlist._id) {
                if (originalShuffleType === 'No Shuffle' && shuffleType !== 'No Shuffle') { // Shuffle
                        songsToPlay = user.queue.slice(user.posInQueue+1);
                        songsToPlay = shuffleArray(songsToPlay);
                        user.queue = user.queue.slice(0, user.posInQueue+1).concat(songsToPlay);
                  }
                  if (originalShuffleType !== 'No Shuffle' && shuffleType === 'No Shuffle') { // Unshuffle
                        for (let i = 0; i < playlist.songs.length; i++) {
                              if (playlist.songs[i]._id.toString() == user.queue[user.posInQueue]._id.toString()) {
                                    console.log(i);
                                    console.log(playlist.songs[i]._id.toString());
                                    console.log(user.queue[user.posInQueue]._id.toString());
                                    user.posInQueue = i;
                                    break;
                              }
                        }
                        user.queue = playlist.songs.map(song => song._id);
                  }
                  if (shuffleType === 'Smart Shuffle') {
                        addSmartSuggestions(user._id);
                  }
            }
      }
      await user.save();
      res.send('Shuffle set to ' + shuffleType);
});

app.get('/api/get_now_playing', async (req, res) => {
      const song = await User.findById(getCurrentUser(req)).populate('queue').exec().then(user => {
            if (!user) {
                  res.status(404).send('User not found');
                  return;
            }
            const nowPlaying = user.queue[user.posInQueue];
            res.send(nowPlaying);
      }).catch(err => {
            console.error('Error fetching user:', err);
            res.status(500).send('Internal server error');
      });
})
app.get('/api/get_next_playing', async (req, res) => {
      const song = await User.findById(getCurrentUser(req)).populate('queue').exec().then(user => {
            if (!user) {
                  res.status(404).send('User not found');
                  return;
            }
            const nowPlaying = user.queue[user.posInQueue+1];
            res.send(nowPlaying);
      }).catch(err => {
            console.error('Error fetching user:', err);
            res.status(500).send('Internal server error');
      });
})
app.get('/api/get_library', async (req, res) => {
      const user = await User.findById(await getCurrentUser(req)).populate({path: 'playlists', populate: { path: 'songs' }}).exec();
      if (!user) {
            res.status(404).send('User not found');
            return;
      }
      res.send(user.playlists);
});
app.get('/api/playlist_data', async (req, res) => {
      const playlist = await Playlist.findById(req.query.id).populate({path: 'songs'}).exec();
      res.send(playlist);
});
app.get('/api/edit_playlist', async (req, res) => {
      const name = req.query.name;
      const id = req.query.id;
      if (id) {
            const playlist = await Playlist.findById(id);
            playlist.name = name;
            await playlist.save();
      } else {
           const newPlaylist = new Playlist({
                  name: name,
                  songs: [],
                  artworkPath: ''
            });
            await newPlaylist.save();
            const user = await getCurrentUser(req);
            await User.findByIdAndUpdate(user, { $push: { playlists: newPlaylist._id } }); 
      }
      res.send('Playlist created');
});
app.get('/api/delete_playlist', async (req, res) => {
      const id = req.query.id;
      if (id) {
            await Playlist.findByIdAndDelete(id);
      }
      res.send('Playlist deleted');
});
app.get('/api/add_to_playlist', async (req, res) => {
      let playlistId = req.query.playlistId;
      if (!playlistId) {
            const user = await User.findById(getCurrentUser(req));
            if (user.queueSource.Playlist) {
                  playlistId = user.queueSource.Playlist;
            }
      }
      const song = await Song.findById(req.query.songId);
      song.isCache = false;
      await song.save();
      const playlist = await Playlist.findById(playlistId);
      if (!playlist) {
            res.status(404).send(false);
            return;
      }
      playlist.songs.push(song._id);
      if (!playlist.artworkPath && song.artworkPath) {
            playlist.artworkPath = song.artworkPath;
      }
      await playlist.save();
      res.send(true);
});
app.get('/api/remove_from_playlist', async (req, res) => {
      const playlistId = req.query.playlistId;
      const songId = req.query.songId;
      const playlist = await Playlist.findById(playlistId).populate('songs').exec();
      if (!playlist) { res.send(false); return; }

      const songIndex = playlist.songs.findIndex(s => s._id.toString() === songId);
      if (songIndex < 0) { res.send(false); return;}
      console.log(songIndex);
      playlist.songs.splice(songIndex, 1);
      await playlist.save();
      res.send(true);
      const documents = await Playlist.find({
            "songs._id": songId
      });
      if (documents.length === 0) {
            const song = await Song.findById(songId);
            song.isCache = true;
            await song.save();
      }
});
app.get('/api/get_devices', async (req, res) => {
      const list = userDevices[await getCurrentUser(req)];
      let devices = []
      for (device of list) {
            devices.push({id: device.socket.id, name: device.name, type: device.type, isPlaying: device.isPlaying});
      }
      res.send(devices);
});
app.get('/', async (req, res) => {
      res.send(true);
});
app.get('/network_test', async (req, res) => {
      res.send('Hello from Ecostream!');
});

let downloadQueue = [];
let isDownloading = false;
function sanitizePath(input) {
    return input
        // Remove null bytes
        .replace(/\0/g, '')
        // Remove path separators (/ and \)
        .replace(/[/\\]/g, '')
        // Remove directory traversal (..)
        .replace(/\.\.+/g, '.')
        // Remove leading/trailing dots and spaces
        .replace(/^[.\s]+|[.\s]+$/g, '')
        // Optional: limit to alphanumeric, dashes, and underscores
        .replace(/[^a-z0-9._-]/gi, '')
        // Replace ?
        .replace(/\?/g, '');
}
let downloadingSongs = [];
const downloadSong = async (artist, title, artworkUrl, albumName, addToPlaylist, addToQueue, suggestionID) => {
      if (downloadingSongs.includes(artist + " - " + title)) { return; }
      downloadingSongs.push(artist + " - " + title);
      // Search YouTube for the song
      const searchQuery = `${title} - ${artist}`;
      console.log('Searching: ' + searchQuery);
      const results = await muse.search(searchQuery, { filter: 'songs' });
      let topResult = results.categories[0].results[0];
      console.log('Found: ' + topResult.title);
      const _duration = topResult.duration;

      // Download artwork
      if ( !fs.existsSync(path.join(__dirname, '../music/', sanitizePath(`${albumName}-${artist}.jpg`)))) {
            try {
                  const response = await axios.get(encodeURI(artworkUrl), { 
                        responseType: 'stream',
                        headers: {
                              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                              'Accept': 'image/avif,image/jxl,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5',
                              'Host': 'lastfm.freetls.fastly.net',
                        }
                  });
                  response.data.pipe(fs.createWriteStream(path.join(__dirname, '../music/', sanitizePath(`${albumName}-${artist}.jpg`))));
            } catch (error) {
                  console.error('Error downloading artwork:', error);
                  return;
            }
      }
      
      // Download song
      // Check type, if not song then loop through top_result.more for the first song
      const link = 'https://www.youtube.com/watch?v=' + topResult.videoId;
      const dl = await import('./apis/downloadSong.mjs');
      var couldDownload = false;
      while (!couldDownload) {
            couldDownload = await dl.downloadSong(link, sanitizePath(title), sanitizePath(artist), path.join(__dirname, '../music/'));
      }

      // Save to MongoDB
      if (suggestionID) {
            let _song = await Song.findById(suggestionID);
            _song.duration = _duration;
            _song.songPath = path.join(`${sanitizePath(title)}-${sanitizePath(artist)}.mp3`);
            _song.artworkPath = path.join(sanitizePath(`${albumName}-${artist}.jpg`));
            await _song.save();
            console.log("Song Saved!");
      } else {
            const newSong = new Song({
                  title: title,
                  artist: artist,
                  duration: _duration,
                  songPath: path.join(`${sanitizePath(title)}-${sanitizePath(artist)}.mp3`),
                  artworkPath: path.join(sanitizePath(`${albumName}-${artist}.jpg`)),
                  isCache: false
            });
            await newSong.save();
            if (addToPlaylist) {
                  const playlist = await Playlist.findById(addToPlaylist);
                  // Atomically push into playlist.songs to avoid race conditions
                  await Playlist.findByIdAndUpdate(playlist._id, { $push: { songs: newSong._id } });
                  if (addToQueue) {
                        const user = await User.findById(addToQueue).populate('queue').populate('queueSource').exec();
                        if (user && user.queueSource && user.queueSource.Playlist && user.queueSource.Playlist.toString() === playlist._id.toString()) {
                              if (user.shuffle === 'No Shuffle') {
                                    await User.findByIdAndUpdate(user._id, { $push: { queue: newSong._id } });
                              } else {
                                    const index = user.posInQueue+1 + Math.floor(Math.random() * (user.queue.length+1 - user.posInQueue-1));
                                    // Use $push with $position for inserting at a specific index
                                    await User.findByIdAndUpdate(user._id, { $push: { queue: { $each: [newSong._id], $position: index } } });
                              }
                        }
                  }
            }
            if (addToQueue) {
                  if (addToQueue != true) {
                        // Atomically push into the user's queue
                        await User.findByIdAndUpdate(addToQueue, { $push: { queue: newSong._id } });
                  }
            }
            // remove from downloading list
            const idx = downloadingSongs.findIndex(s => s === artist + " - " + title);
            if (idx !== -1) downloadingSongs.splice(idx, 1);
            return newSong;
      }
}
const downloadQueueProcessor = async () => {
      if (downloadQueue.length > 0 && !isDownloading) {
            isDownloading = true;
            const item = downloadQueue[0];
            const song = await downloadSong(item.artist, item.title, item.artworkUrl, item.albumName, item.addToPlaylist, item.addToQueue);
            if (song) {
                  downloadQueue.shift();
            }
            isDownloading = false;
            downloadQueueProcessor();
      }
}
downloadQueueProcessor();
app.get('/api/download', async (req, res) => {
      // Get song data
      const artist = req.query.artist;
      const title = req.query.title;
      const artworkUrl = req.query.artworkUrl;
      const albumName = req.query.albumName;
      const addToPlaylist = req.query.addToPlaylist; // id of playlist
      let addToQueue = req.query.addToQueue; // id of user for queue
      const existingSong = await Song.findOne({ title: title, artist: artist });
      if (existingSong) {
            existingSong.isCache = addToPlaylist ? false : existingSong.isCache;
            await existingSong.save();
            if (addToPlaylist) {
                  const playlist = await Playlist.findById(addToPlaylist);
                  await Playlist.findByIdAndUpdate(playlist._id, { $push: { songs: existingSong._id } });
                  const user = await User.findById(await getCurrentUser(req)).populate('queue').populate('queueSource').exec();
                  if (user && user.queueSource && user.queueSource.Playlist && user.queueSource.Playlist.toString() === playlist._id.toString()) {
                        if (user.shuffle==='No Shuffle') {
                              await User.findByIdAndUpdate(user._id, { $push: { queue: existingSong._id } });
                        } else {
                              const index = user.posInQueue+1 + Math.floor(Math.random() * (user.queue.length+1 - user.posInQueue-1));
                              await User.findByIdAndUpdate(user._id, { $push: { queue: { $each: [existingSong._id], $position: index } } });
                        }
                  }
            }
            res.send(existingSong);
            console.log('Adding song');
            return;
      }
      if (!addToQueue) {
            addToQueue = await getCurrentUser(req);
      }
      const newSong = await downloadSong(artist, title, artworkUrl, albumName, addToPlaylist, addToQueue);
      
      res.send(newSong);

      console.log('Download complete: ' + title + ' by ' + artist);
});

app.get('/api/get_song_stream', async (req, res) => {
      const link = 'https://www.youtube.com/watch?v=' + req.query.videoId;

      const dl = await import('./apis/downloadSong.mjs');

      // Use ytdlp-nodejs to get a readable stream
      // Filter for 'bestaudio' to ensure a smaller, audio-only payload
      res.writeHead(200, {
            'Content-Type': 'audio/webm',
            'Transfer-Encoding': 'chunked',
            'Connection': 'keep-alive',
            'X-Content-Type-Options': 'nosniff',
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
      });

      res.write('');
      const stream = dl.streamSong(link, res);

      // Pipe the stream directly to the response
      //stream.pipe(res);
});
app.get('/api/add_streamed_song', async (req, res) => {
      const artist = req.query.artist;
      const title = req.query.title;
      const artwork = req.query.artwork;
      const searchQuery = `${title} - ${artist}`;
      const results = await muse.search(searchQuery, { filter: 'songs' });
      let topResult = results.categories[0].results[0];
      if (topResult) {
            // Save to MongoDB
            const newSong = new Song({
                  title: title,
                  artist: artist,
                  songPath: topResult.videoId,
                  artworkPath: artwork,
                  isStream: true
            });
            await newSong.save();
            
            res.send(newSong);
      }
});

httpServer.listen(PORT, () => {
      console.log(`server listening on port ${PORT}`);
})
const express = require('express');
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

// node index.js to run backend

const uri = "";
const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

app.use(cors());

app.use('/media', express.static(path.join(__dirname, '../music'), { fallthrough: false }));

const PORT = 8080;

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

app.get('/api/get_song', (req, res) => {
      //const mbid = req.query.mbid;
      res.send('http://localhost:8080/media/' + mbid + '.mp3');
})

app.get('/api/add_to_queue', async (req, res) => {
      const mbid = req.query.mbid;
      const index = req.query.index;
      console.log('Adding to queue: ' + mbid);
      const song = await Song.findOne({ mbid: mbid });
      if (!song) {
            res.status(404).send('Song not found');
            return;
      }
      await User.findOneAndUpdate({ username: 'test_user' }, { $push: { queue: song._id, }, queueSource: { Song: song.mbid } });
      res.send('Added to queue');
});
app.get('/api/control_queue', async (req, res) => {
      const action = req.query.action; // 'next', 'prev', or 'play'
      const song = req.query.songId; // for 'play' action
      const user = await User.findOne({ username: 'test_user' }).populate('queue').exec();
      console.log(user);
      if (!user) {
            res.status(404).send('User not found');
            return;
      }
      if (action === 'next') {
            user.posInQueue = Math.min(user.posInQueue + 1, user.queue.length - 1);
      } else if (action === 'prev') {
            user.posInQueue = Math.max(user.posInQueue - 1, 0);
      } else if (action === 'play') {
            console.log('Playing song ID: ' + song._id);
            await User.findOneAndUpdate({ username: 'test_user' }, { $push: { queue: song._id, $position: 0 }, queueSource: { Song: song.mbid } });            
            user.posInQueue = 0;
      }
      await user.save();

      const nowPlaying = user.queue[user.posInQueue];
      res.send(nowPlaying);
});

app.get('/api/get_now_playing', async (req, res) => { 
      const song = await User.findOne({ username: 'test_user' }).populate('queue').exec().then(user => {
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
app.get('/api/get_library', async (req, res) => {
      const user = await User.findOne({ username: 'test_user' }).populate({path: 'playlists', populate: { path: 'songs' }}).exec();
      if (!user) {
            res.status(404).send('User not found');
            return;
      }
      res.send(user.playlists);
});
app.get('/api/create_playlist', async (req, res) => {
      const name = req.query.name;
      const newPlaylist = new Playlist({
            name: name,
            songs: [],
            artworkPath: ''
      });
      await newPlaylist.save();
      await User.findOneAndUpdate({ username: 'test_user' }, { $push: { playlists: newPlaylist._id } });
      res.send('Playlist created');
});

app.get('/', async (req, res) => {
      res.send('Hello from Ecostream!');
      //const result = await User.create({ 
      //      username: 'test_user', 
      //      password: 'password123'
      //});
});

app.get('/api/download', async (req, res) => {
      // Get song data
      const artist = req.query.artist;
      const title = req.query.title;
      const artworkUrl = req.query.artworkUrl;
      const mbid = req.query.mbid;
      const albumMbid = req.query.albumMbid;

      // Search YouTube for the song
      const searchQuery = `${title} - ${artist}`;
      console.log('Searching: ' + searchQuery);
      const results = await muse.search(searchQuery, { filter: 'songs' });
      res.send(results);
      console.log(results);
      let topResult = results.categories[0].results[0];
      console.log('Found: ' + topResult.title);
      console.log(topResult);
      const _duration = topResult.duration;

      // Download artwork
      if ( !fs.existsSync(path.join(__dirname, '../music/', `${albumMbid}.jpg`))) {
            try {
                  const response = await axios.get(encodeURI(artworkUrl), { 
                        responseType: 'stream',
                        headers: {
                              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                              'Accept': 'image/avif,image/jxl,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5',
                              'Host': 'lastfm.freetls.fastly.net',
                        }
                  });
                  response.data.pipe(fs.createWriteStream(path.join(__dirname, '../music/', `${albumMbid}.jpg`)));
            } catch (error) {
                  console.error('Error downloading artwork:', error);
            }
      }
      
      // Download song
      // Check type, if not song then loop through top_result.more for the first song
      const link = 'https://www.youtube.com/watch?v=' + topResult.videoId;
      const dl = await import('./apis/downloadSong.mjs');
      const result = await dl.default(link, mbid, path.join(__dirname, '../music/'));

      // Save to MongoDB
      const newSong = new Song({
            title: title,
            artist: artist,
            duration: _duration,
            mbid: mbid,
            songPath: path.join(`${mbid}.mp3`),
            artworkPath: path.join(`${albumMbid}.jpg`)
      });
      await newSong.save();

      console.log('Download complete: ' + title + ' by ' + artist);
});

app.listen(PORT, () => {
      console.log(`server listening on port ${PORT}`);
})
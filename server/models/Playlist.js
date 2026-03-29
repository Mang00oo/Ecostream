const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  songs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song'
  }],
  artworkPath: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Playlist', playlistSchema);

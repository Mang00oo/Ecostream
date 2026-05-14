const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  shuffle: {
    type: String,
    enum: ['Shuffle', 'No Shuffle', 'Smart Shuffle'],
    default: 'No Shuffle'
  },
  songs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song'
  }],
  artworkPath: {
    type: String,
  }
});

module.exports = mongoose.model('Playlist', playlistSchema);

const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  artist: {
    type: String,
    required: true
  },
  duration: {
    type: String
  },
  mbid: {
    type: String
  },
  songPath: {
    type: String,
    required: true
  },
  artworkPath: {
    type: String,
    required: true
  },
  isCache: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Song', songSchema);

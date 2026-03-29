const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({ 
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String
    },
    playlists: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Playlist'
    }],

    queue: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Song'
    }],
    queueSource: {
        Playlist: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Playlist'
        },
        Song: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Song'
        }
    },
    posInQueue: {
        type: Number,
        default: 0
    },
    posInSong: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('User', userSchema);
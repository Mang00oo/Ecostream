import * as serverApi from './server-api';
import * as offlineApi from './offline';

var queue = [];
var queuePos = 0;
export async function setQueue(_queue) {
    queue = _queue;
    let downloadedQueue = [];
    const oldQueuePos = queuePos;
    let removed = 0;
    for (const [index, song] of queue.entries()) {
        console.log(song);
        if (await offlineApi.isDownloaded(song.songPath)) {
            downloadedQueue.push(song);
            console.log('pushed');
        } else {
            console.log('skipped');
            if (index <= oldQueuePos) {
                removed ++;
            }
        }
    }
    localStorage.setItem('queue', JSON.stringify(downloadedQueue));
    setQueuePos(oldQueuePos - removed);
}
export function setQueuePos(pos) {
    queuePos = Math.max(0, pos);
    localStorage.setItem('queuePos', queuePos);
}

var queueInitialized = false;

async function ensureQueueInitialized() {
    console.log('Ensuring queue');
    if (queueInitialized) return;

    const isOnline = await serverApi.getIsOnline();
    if (isOnline) {
        const queueResponse = await serverApi.getQueue();
        setQueuePos(Number(await serverApi.getPosInQueue()) || 0);
        setQueue(queueResponse?.queue || []);
    } else {
        queue = JSON.parse(localStorage.getItem('queue') || '[]');
        queuePos = Number(localStorage.getItem('queuePos') || 0);
        queuePos = Math.max(0, Math.min(queuePos, Math.max(queue.length - 1, 0)));
        console.log(queue);
        console.log(queuePos);
    }

    queueInitialized = true;
}
export async function nextSong() {
    await ensureQueueInitialized();

    if (await serverApi.getIsOnline()) {
        const response = await serverApi.controlQueue('next');
        queuePos = Number(await serverApi.getPosInQueue()) || queuePos;
        return response;
    } else {
        queuePos = Math.min(queue.length - 1, queuePos + 1);
        setQueuePos(queuePos);
        return queue[queuePos];
    }
}
export async function prevSong() {
    await ensureQueueInitialized();

    if (await serverApi.getIsOnline()) {
        const response = await serverApi.controlQueue('prev');
        queuePos = Number(await serverApi.getPosInQueue()) || queuePos;
        return response;
    } else {
        queuePos = Math.max(0, queuePos - 1);
        setQueuePos(queuePos);
        return queue[queuePos];
    }
}
export async function playSong(id) {
    await ensureQueueInitialized();
    if (await serverApi.getIsOnline()) {
        return await serverApi.controlQueue('play', id);
    } else {
        if (queue.some(s => s._id.toString() === id)) {
            console.log('SETTING LOCAL QUEUE');
            await setQueuePos(queue.findIndex(s => s._id.toString() === id));
            return await getSong();
        } else {
            //_song = await Song.findById(song);
            //user.queue.unshift(_song);
            //user.posInQueue = 0; 
            return await getSong();
        }
    }
}
export async function getSong() {
    await ensureQueueInitialized();
    if (await serverApi.getIsOnline()) {
        return await serverApi.getNowPlaying();
    } else {
        return queue[queuePos];
    }
    
}
export async function getQueue() {
    await ensureQueueInitialized();
    if (await serverApi.getIsOnline()) {
        const response = await serverApi.getQueue();
        return response.queue;
    } else {
        return queue;
    }
}
export async function getQueuePos() {
    await ensureQueueInitialized();
    if (await serverApi.getIsOnline()) {
        return await serverApi.getPosInQueue();
    } else {
        return queuePos;
    }
}
export async function nextSongPreload() {
    await ensureQueueInitialized();

    if (await serverApi.getIsOnline()) {
        return await serverApi.getNextPlaying();
    } else {
        return queue[Math.min(queue.length, queuePos + 1)];
    }
}

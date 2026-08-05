import * as serverApi from './server-api';

var queue = [];
var queuePos = 0;
export function setQueue(_queue) {
    queue =_queue;
    localStorage.setItem('queue', JSON.stringify(queue));
    // TODO: check if songs are downloaded before setting them in the localStorage
}
export function setQueuePos(pos) {
    queuePos = pos;
    localStorage.setItem('queuePos', queuePos);
}

var queueInitialized = false;

async function ensureQueueInitialized() {
    console.log('Ensuring queue');
    if (queueInitialized) return;

    const isOnline = await serverApi.getIsOnline();
    if (isOnline) {
        const queueResponse = await serverApi.getQueue();
        setQueue(queueResponse?.queue || []);
        setQueuePos(Number(await serverApi.getPosInQueue()) || 0);
    } else {
        queue = JSON.parse(localStorage.getItem('queue') || '[]');
        queuePos = Number(localStorage.getItem('queuePos') || 0);
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
        queuePos = Math.min(queue.length, queuePos + 1);
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
export async function getSong() {
    await ensureQueueInitialized();
    return queue[queuePos];
}
export async function nextSongPreload() {
    await ensureQueueInitialized();

    if (await serverApi.getIsOnline()) {
        return await serverApi.getNextPlaying();
    } else {
        return queue[Math.min(queue.length, queuePos + 1)];
    }
}
await ensureQueueInitialized();
console.log(queue);
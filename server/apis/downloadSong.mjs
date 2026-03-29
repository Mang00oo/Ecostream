import { YtDlp } from 'ytdlp-nodejs';

const ytdlp = new YtDlp();

// Download a video with fluent API
export default async function downloadSong(url, mbid, path) {
  const result = await ytdlp
  .download(url)
  .audioFormat('mp3')
  .extractAudio()
  .on('progress', (p) => console.log(`${p.percentage_str}`))
  .output(path)
  .setOutputTemplate(`../music/${mbid}.%(ext)s`)
  .run();

  console.log('Downloaded:', result.filePaths);
}

// Stream to file
//import { createWriteStream } from 'fs';
//const stream = ytdlp.stream('https://youtube.com/watch?v=dQw4w9WgXcQ');
//await stream.pipeAsync(createWriteStream('video.mp4'));
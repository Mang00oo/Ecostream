import { YtDlp } from 'ytdlp-nodejs';

const ytdlp = new YtDlp();

// Download a video with fluent API
export async function downloadSong(url, title, artist, path) {
  const result = await ytdlp
  .download(url)
  .audioFormat('mp3')
  .extractAudio()
  .on('progress', (p) => console.log(`${p.percentage_str}`))
  .output(path)
  .setOutputTemplate(`../music/${title}-${artist}.%(ext)s`)
  .on('error', (err) => console.error(err))
  .run();

  console.log('Downloaded:', result.filePaths);
}
export function streamSong(url, res) {
  const result = ytdlp.stream(url, {
    highWaterMark: 64 * 1024, // 64KB buffer for faster streamingç
    filter: 'bestaudio',
    quality: 'highestaudio',
    args: [
        '--extractor-args', 'youtube:player_client=web,android',
        '--no-playlist',               // Prevents overhead of checking for lists
    ]
  })
  .addOption('--no-buffer')
  .audioQuality('3')
  .extractAudio()
  .pipe(res);
  return result;
}

// Stream to file
//import { createWriteStream } from 'fs';
//const stream = ytdlp.stream('https://youtube.com/watch?v=dQw4w9WgXcQ');
//await stream.pipeAsync(createWriteStream('video.mp4'));
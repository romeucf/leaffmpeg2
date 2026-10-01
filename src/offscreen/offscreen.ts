import { FFmpeg } from '@ffmpeg/ffmpeg';

const ffmpeg = new FFmpeg();

async function initFFmpeg() {
  if (!ffmpeg.loaded) {
    await ffmpeg.load({
      coreURL: chrome.runtime.getURL('ffmpeg/ffmpeg-core.js'),
      wasmURL: chrome.runtime.getURL('ffmpeg/ffmpeg-core.wasm'),
    });
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CONVERT') {
    (async () => {
      try {

        await initFFmpeg();

        await ffmpeg.writeFile(message.inputName, message.data);

        await ffmpeg.exec(['-i', message.inputName, message.outputName]);

        const data = await ffmpeg.readFile(message.outputName);

        await ffmpeg.deleteFile(message.inputName);
        await ffmpeg.deleteFile(message.outputName);
        
        sendResponse({ type: 'SUCCESS', data });
      } catch (error) {
        sendResponse({ type: 'ERROR', error: String(error) });
      }

    })();

    return true;
  }
});
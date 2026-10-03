import { FFmpeg } from '@ffmpeg/ffmpeg';
import type { ProgressResponse, SuccessResponse, ErrorResponse } from '../shared/messages';

const ffmpeg = new FFmpeg();

function sendProgress(progress: number, message: string) {
    const payload: ProgressResponse = {
        type: 'PROGRESS',
        progress,
        message,
    };
    chrome.runtime.sendMessage(payload).catch(() => {
        // Ignora caso não haja ouvintes conectados no momento
    });
}

async function initFFmpeg() {
    if (!ffmpeg.loaded) {
        await ffmpeg.load({
            coreURL: chrome.runtime.getURL('ffmpeg/ffmpeg-core.js'),
            wasmURL: chrome.runtime.getURL('ffmpeg/ffmpeg-core.wasm'),
        });
    }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'CONVERT') {
        (async () => {
            const handleProgress = ({ progress }: { progress: number }) => {
                const clampedProgress = Number.isFinite(progress) ? Math.min(Math.max(progress, 0), 1) : 0;
                const percentage = Math.round(clampedProgress * 100);
                sendProgress(clampedProgress, `Convertendo: ${percentage}%`);
            };

            const inputName = message.fileName || message.inputName || 'input.file';
            const outputName =
                message.outputName ||
                (message.fileName && message.outputFormat
                    ? `${message.fileName.replace(/\.[^/.]+$/, '')}.${message.outputFormat.replace(/^\./, '')}`
                    : 'output.mp4');

            try {
                sendProgress(0, ffmpeg.loaded ? 'Iniciando conversão...' : 'Carregando FFmpeg...');
                await initFFmpeg();

                sendProgress(0.05, 'Preparando arquivo...');
                const rawData = message.fileData || message.data;
                if (!rawData) {
                    throw new Error('Nenhum dado de arquivo foi fornecido.');
                }
                const fileData = rawData instanceof Uint8Array ? rawData : new Uint8Array(rawData);
                await ffmpeg.writeFile(inputName, fileData);

                ffmpeg.on('progress', handleProgress);

                sendProgress(0.1, 'Convertendo: 0%');
                const exitCode = await ffmpeg.exec(['-i', inputName, outputName]);
                if (exitCode !== 0) {
                    throw new Error(`FFmpeg finalizou com código de erro ${exitCode}`);
                }

                sendProgress(0.95, 'Finalizando conversão...');
                const data = await ffmpeg.readFile(outputName);

                try {
                    await ffmpeg.deleteFile(inputName);
                    await ffmpeg.deleteFile(outputName);
                } catch {
                    // Ignora eventuais falhas ao deletar arquivos temporários
                }

                sendProgress(1, 'Conversão concluída com sucesso!');

                const fileOutput = data instanceof Uint8Array ? data.buffer : (data as unknown as ArrayBuffer);
                const response: SuccessResponse & { data: typeof data } = {
                    type: 'SUCCESS',
                    fileOutput: fileOutput as ArrayBuffer,
                    newName: outputName,
                    data,
                };
                sendResponse(response);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                sendProgress(0, `Erro: ${errorMessage}`);
                const response: ErrorResponse & { error: string } = {
                    type: 'ERROR',
                    errorMessage,
                    error: errorMessage,
                };
                sendResponse(response);
            } finally {
                ffmpeg.off('progress', handleProgress);
            }
        })();

        return true;
    }
});
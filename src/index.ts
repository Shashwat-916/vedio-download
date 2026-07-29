import ytDlp from 'yt-dlp-exec';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';

export type YoutubeDownloadParams = {
    url: string;
    folder?: string;
    outputFileName?: string;
};

export async function getBestVideo(url: string, output: string): Promise<void> {
    await ytDlp(url, {
        format: 'bestvideo',
        output,
    });
}

export async function getBestAudio(url: string, output: string): Promise<void> {
    await ytDlp(url, {
        format: 'bestaudio',
        output,
    });
}

export function mergeVideoAudio(
    videoPath: string,
    audioPath: string,
    outputPath: string
): Promise<void> {
    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(videoPath)
            .input(audioPath)
            .outputOptions([
                '-c:v copy',
                '-c:a aac',
            ])
            .save(outputPath)
            .on('end', () => {
                try {
                    if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
                    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
                } catch (err) {
                    console.warn('⚠️ Warning removing temporary files:', err);
                }
                resolve();
            })
            .on('error', (err) => {
                reject(err);
            });
    });
}

export async function youtubeDownload({
    url,
    folder = 'downloads',
    outputFileName = 'output.mp4',
}: YoutubeDownloadParams): Promise<string> {
    try {
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }

        const timestamp = Date.now();
        const videoPath = path.join(folder, `temp_video_${timestamp}.mp4`);
        const audioPath = path.join(folder, `temp_audio_${timestamp}.m4a`);
        const outputPath = path.join(folder, outputFileName);

        console.log(`\n🎬 Starting download for: ${url}`);
        console.log(`📹 Extracting highest quality video stream...`);
        await getBestVideo(url, videoPath);

        console.log(`🎵 Extracting highest quality audio stream...`);
        await getBestAudio(url, audioPath);

        console.log(`⚙️ Merging video & audio streams with FFmpeg...`);
        await mergeVideoAudio(videoPath, audioPath, outputPath);

        console.log(`\n🎉 Download complete! Saved to: ${outputPath}\n`);
        return outputPath;
    } catch (error) {
        console.error('❌ Download failed:', error);
        throw error;
    }
}

// Backward compatibility export
export const YoutubeDownload = youtubeDownload;

// CLI Execution handler: runs if executed directly via node/tsx/npm
const inputUrl = process.argv[2] || 'https://www.youtube.com/watch?v=Q9wQ0G7N-tc';
youtubeDownload({
    url: inputUrl,
    outputFileName: 'output.mp4',
}).catch(() => process.exit(1));


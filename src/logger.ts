import ololog from 'ololog';
import ansi from 'ansicolor';
import { createStream, RotatingFileStream, Options } from 'rotating-file-stream';

export type StreamWriter = { write: (chunk: any) => void };

export class CLogger {
    public accessLogStream: Map<string, StreamWriter> = new Map();
    private logPath: string;
    private options: Options;

    constructor(
        opts = {
            size: '1M',
            interval: '1h',
        },
        logPath = './logs/'
    ) {
        this.options = opts;
        this.logPath = logPath;
    }

    public getStream(fileName: string) {
        if (!this.accessLogStream.has(fileName)) {
            const stream = this.createBufferStream(
                createStream(this.nameGenerator(fileName), {
                    path: this.logPath,
                    // immutable: true,
                    ...this.options,
                })
            );
            stream.write(`\n${new Date().toLocaleString()}\tNEW_LAUNCH\n`);
            this.accessLogStream.set(fileName, stream);
        }

        return this.accessLogStream.get(fileName);
    }

    /**
     * Create a basic buffering stream.
     */
    public createBufferStream(stream: RotatingFileStream, interval: number = 1e3) {
        let buf = [];
        let timer = null;

        // return a minimal "stream"
        return {
            write(chunk: any) {
                if (timer === null) {
                    timer = setTimeout(() => {
                        timer = null;
                        stream.write(buf.join(''));
                        buf.length = 0;
                    }, interval);
                }

                buf.push(chunk);
            },
        };
    }

    public toLog(data: any, fileName = 'app') {
        const stream = this.getStream(fileName);
        stream.write(data);
    }

    nameGenerator = (name: string) => (time: Date, index: Number) => {
        if (!time) {
            return name + '.log';
        }

        const year = time.getFullYear();
        const month = (time.getMonth() + 1).toString().padStart(2, '0');
        const day = time.getDate().toString().padStart(2, '0');
        const hour = time.getHours().toString().padStart(2, '0');
        const minute = ''; //time.getMinutes().toString().padStart(2, '0');

        return `${name}-${year}${month}${day}-${hour}${minute}-${index}.log`;
    };
}
export const Logger = new CLogger();

export const log = ololog.configure({
    time: true,
    tag: true,
    'render+'(text, { consoleMethod = '' }) {
        if (text) {
            // remove ANSI codes
            const strippedText = ansi.strip(text).trim() + '\n';

            if (consoleMethod) {
                Logger.toLog(strippedText, 'info');

                /*  Writes .error and .warn calls to a separate file   */

                if (consoleMethod === 'error' || consoleMethod === 'warn') {
                    Logger.toLog(strippedText, 'error');
                }
            }
        }

        return text;
    },
});
export default log;

process.on('uncaughtException', (e) => {
    log.bright.red.error.noLocate(e);
});
process.on('unhandledRejection', (e) => {
    log.bright.red.error.noLocate(e);
});
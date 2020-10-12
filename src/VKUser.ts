import ansi from 'ansicolor';
import { customLocator, log } from './logger';
import { PixelAPI } from './Pixel/PixelAPI';
import { LoadingState } from './types';

export interface VKUserParams {
    embedURL?: string;
    token?: string;
    login?: string;
    password?: string;
}

export abstract class VKUser {
    protected embedURL?: string;
    private token?: string;
    private login?: string;
    private password?: string;

    public userId?: number;
    public api: PixelAPI;

    public isDebug: boolean = true;
    public loadingState: LoadingState = LoadingState.NONE;

    constructor({ password, embedURL, token, login }: VKUserParams) {
        this.embedURL = embedURL;
        this.token = token;
        this.login = login;
        this.password = password;
    }

    public async start(): Promise<boolean> {
        this.loadingState = LoadingState.LAODING;
        await this.extractEmbedURL();
        return await this._start();
    }

    protected async extractEmbedURL(hi: boolean = false) {
        if (this.embedURL) {
            this.api = new PixelAPI(this.embedURL);
            this.userId = this.api.userId;
            this.log.debug('User embedURL extracted');
            return;
        }

        if (!this.token && this.login && this.password) {
            // TODO: Get token (auth vk)
        }

        if (this.token) {
            // TODO: Get EmbedURL by token
        }

        if (!hi) this.extractEmbedURL(true);
    }

    protected abstract async _start(): Promise<boolean>;

    public get log() {
        return log.info.yellow.configure({
            '+tag': (lines) => {
                lines[0] = ansi.lightMagenta(`[@${this.userId.toString().padEnd(9, ' ')}] `) + lines[0];
                return lines;
            },
            locate: customLocator,
        });
    };
}

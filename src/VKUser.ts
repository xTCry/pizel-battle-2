import { log } from './logger';
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

    public async start() {
        this.loadingState = LoadingState.LAODING;
        await this.extractEmbedURL();
        this.debug('User embedURL extracted');
        await this._start();
    }

    protected async extractEmbedURL(hi: boolean = false) {
        if (this.embedURL) {
            this.api = new PixelAPI(this.embedURL);
            this.userId = this.api.userId;
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

    protected abstract async _start(): Promise<void>;

    public debug(...args: any) {
        if (this.isDebug) {
            log.info.yellow(`[@${this.userId}]`, ...args);
        }
    }

    public debugError(...args: any) {
        if (this.isDebug) {
            log.error.yellow(`[@${this.userId}]`, ...args);
        }
    }
}

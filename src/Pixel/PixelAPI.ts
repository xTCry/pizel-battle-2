import url from 'url';
import Axios from 'axios';
import { config } from '../config';
import { decodeURLParams, OmyEval } from '../tools';
import { log } from '../logger';

export class PixelAPI {
    public readonly API_URL = config.get('API_URL');
    protected embedURL: string;

    constructor(embedURL: string) {
        this.embedURL = embedURL;
    }

    public async get(methodName: string, data?: any) {
        return this.request('GET', methodName, data);
    }

    public async post(methodName: string, data?: any) {
        return this.request('POST', methodName, data);
    }

    public async request(method: 'GET' | 'POST', methodName: string, data?: any) {
        const isPost = method.toLocaleUpperCase() === 'POST';
        const url = this.API_URL + methodName + (!isPost && data ? '?' + PixelAPI.stringify(data) : '');
        return await this.requestCustom(method, url, data);
    }

    public async requestCustom(method: 'GET' | 'POST', url: string, data?: any) {
        const isPost = method.toLocaleUpperCase() === 'POST';
        const authHeaders = this.startSearch ? { 'X-vk-sign': this.startSearch } : {};
        const contentType = isPost ? { 'Content-Type': 'application/json', Accept: 'application/json' } : {};

        // log.info.lightYellow('API request url', url);

        try {
            const response = await Axios.request({
                method,
                url,
                headers: {
                    ...contentType,
                    ...authHeaders,
                    Referer: this.embedURL,
                },
                data,
            });
            return { response, data: response.data };
        } catch (err) {
            return { error: { code: err.statusCode, msg: err.message, uri: url } };
        }
    }

    get startSearch() {
        if (!this.embedURL) {
            return undefined;
        }

        const plink = url.parse(this.embedURL);
        return plink.search;
    }

    get userId() {
        if (!this.embedURL) {
            return undefined;
        }

        const { search } = url.parse(this.embedURL);
        const { vk_user_id } = decodeURLParams(search);
        if (!vk_user_id) {
            return undefined;
        }
        return parseInt(vk_user_id);
    }

    get host() {
        if (!this.embedURL) {
            return undefined;
        }

        const plink = url.parse(this.embedURL);
        return plink.host;
    }

    getWSUrl({
        url,
        useHTTPS = true,
        prefix = '',
        sign,
        code,
    }: { url?: string; useHTTPS?: boolean; prefix?: string; sign?: any; code?: any } = {}) {
        prefix += this.startSearch;

        if (url) {
            return `${url}${this.startSearch}`;
        }

        return `${useHTTPS ? 'wss://' : 'ws://'}${this.host}${prefix}${sign ? `&s=${sign}` : ''}${
            code ? `&c=${OmyEval(code)}` : ''
        }`;
    }

    static stringify(object, asRaw = false, prefix = false) {
        let arr = [];
        for (let key in object) {
            if (object.hasOwnProperty(key)) {
                let value = object[key];
                if (value === undefined) {
                    continue;
                }
                if (typeof value.forEach === 'function') {
                    value.forEach((i) => arr.push({ k: (prefix ? prefix + '[' + key + ']' : key) + '[]', v: i }));
                } else if (typeof value === 'object') {
                    // @ts-ignore
                    let resolve = PixelAPI.stringify(value, true, prefix ? prefix + '[' + key + ']' : key);
                    // @ts-ignore
                    resolve.forEach((i) => arr.push(i));
                } else {
                    arr.push({ k: prefix ? prefix + '[' + key + ']' : key, v: value });
                }
            }
        }
        if (asRaw) {
            return arr;
        } else {
            return arr.map((e) => e.k + '=' + encodeURIComponent(e.v)).join('&');
        }
    }

    // Old originals methods

    /* private async __call(method, params, httpMethod = 'GET') {
        let url = `${this.API_URL}/${method}`;

        let requestParams = {
            method: httpMethod ? httpMethod : 'GET',
            // cache: 'no-cache',
            // redirect: 'error',
            headers: {
                'X-vk-sign': this.startSearch,
            },
        };

        if (httpMethod.toString().toUpperCase() !== 'GET') {
            if (!(params instanceof FormData)) {
                requestParams['headers']['Content-Type'] = 'application/json';
            }
            requestParams['body'] = params instanceof FormData ? params : JSON.stringify(params);
        } else {
            url += '?' + PixelAPI.stringify(params);
        }

        try {
            return await fetch(url, requestParams).catch((e) => {
                if (e instanceof TypeError) {
                    e['network'] = true;
                    e['message'] = e.message + ' ' + url;
                }
                throw e;
            });
        } catch (e) {
            throw e;
        }
    }

    public async __request(method, params, httpMethod = 'GET', retry = 5) {
        try {
            const r = await this.__call(method, params, httpMethod);
            try {
                let contentType = r.headers.get('Content-Type');
                if (contentType && contentType.indexOf('application/json') !== -1) {
                    r.json().then((data) => {
                        if (data.response !== undefined) {
                            return data.response;
                        } else if (data.error !== undefined && data.error && data.error.message !== undefined) {
                            throw data.error;
                        } else {
                            throw data;
                        }
                    });
                } else {
                    if (retry > 0) {
                        await sleep(Math.random() * 1000);
                        return await this.__request(method, params, httpMethod, retry - 1);
                    } else {
                        // ConnectionError
                        throw new Error(
                            httpMethod + ' ' + method + ' response ' + r.status + ' Content-Type: ' + contentType
                        );
                    }
                }
            } catch (e) {
                if (e && e.network && retry > 0) {
                    await sleep(Math.random() * 1000);
                    return await this.__request(method, params, httpMethod, retry - 1);
                } else {
                    throw e;
                }
            }
        } catch (e) {
            if (retry > 0) {
                await sleep(Math.random() * 1000);
                return await this.__request(method, params, httpMethod, retry - 1);
            } else {
                throw e;
            }
        }
    } */
}

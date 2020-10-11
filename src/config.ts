import 'dotenv/config';
import convict from 'convict';
import Fs from 'fs-extra';

convict.addFormat(require('convict-format-with-validator').url);

export const configSchema = {
    GROUP_ID: {
        doc: 'VK Group ID (without -)',
        default: null,
        env: 'GROUP_ID',
        coerce(val) {
            return parseInt(val, 10);
        },
        format(val) {
            if (val < 0) {
                throw new Error('Wrong GROUP_ID');
            }
        },
    },
    API_URL: {
        format: '*',
        default: 'https://pixel-dev.w84.vkforms.ru/api/',
        env: 'API_URL',
    },
    TEST_EMBED_URL: {
        format: '*',
        default: null,
        env: 'TEST_EMBED_URL',
    },
    IMG_URL: {
        format: '*',
        default: '',
        env: 'IMG_URL',
    },
};

const configPath = './config.json';
export const config = convict(configSchema);

function loadConfig(conv: convict.Config<any>, pathFile: string) {
    if (!Fs.existsSync(pathFile)) {
        console.log(`Created new config file "${pathFile}"`);
        Fs.outputFileSync(pathFile, conv.toString());
    }

    conv.loadFile(pathFile).validate();
}

loadConfig(config, configPath);

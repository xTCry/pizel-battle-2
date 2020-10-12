import ansi from 'ansicolor';
import StackTracey from 'stacktracey';
import { isBlank } from 'printable-characters';
import { customLocator,log } from '../src/logger';

const changeLastNonemptyLine = (lines, fn) => {
    for (let i = lines.length - 1; i >= 0; i--) {
        if (i === 0 || !isBlank(lines[i])) {
            lines[i] = fn(lines[i]);
            break;
        }
    }
    return lines;
};

const my = {
    userId: 123,
    get debug() {
        return log.info.yellow.configure({
            // '+concat': (lines: any[][]) => {
            //     lines[0].unshift(`[@${this.userId}]`);
            //     return lines;
            // },
            '+tag': (lines) => {
                // console.log(lines)
                lines[0] = ansi.lightMagenta(`[@${this.userId.toString().padStart(9, ' ')}] `) + lines[0];
                return lines;
            },
            /* 'locate+': (lines, data) => {
                console.log(lines, data);
                
                return lines;
            } */
            /* '+locate': (lines, data) => {
                console.log(lines, data);
                // @ts-ignore
                console.log(new StackTracey().clean.at(1));
                
                return lines;
            } */
            locate: customLocator/* (lines, {

                shift = 0,
                // @ts-ignore
                where = (new StackTracey ().clean.at (1 + shift)),
                join  = ((a, sep, b) => (a && b) ? (a + sep + b) : (a || b)),
                print = ({ calleeShort, fileName = [], line = [] }) => ansi.darkGray ('(' + join (calleeShort, ' @ ', join (fileName, ':', line)) + ')')

            }) => changeLastNonemptyLine (lines, line => join (line, ' ', print (where))) */
        });
    },
};

log.info.yellow('Test 0', 0);

my.debug('Test2', 10 + 8);

(() => {
    my.debug('Test 0000', 987);
})();

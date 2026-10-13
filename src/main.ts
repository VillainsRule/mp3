import { $ } from 'bun';

import fs from 'fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline/promises';

const red = (text: string) => `\x1b[31m${text}\x1b[0m`;
const yellow = (text: string) => `\x1b[93m${text}\x1b[0m`;
const green = (text: string) => `\x1b[32m${text}\x1b[0m`;
const blue = (text: string) => `\x1b[36m${text}\x1b[0m`;

const check = '✔';
const error = '✖';

const promptYN = async (prompt: string, defaultAns: boolean = true): Promise<boolean> => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    rl.on('SIGINT', () => {
        rl.close();
        process.exit(130);
    });

    const answer = (await rl.question(`${blue(prompt)} ${yellow(`[${defaultAns ? 'Y/n' : 'y/N'}]`)} `)).trim().toLowerCase();
    rl.close();

    if (answer.startsWith('y')) return true;
    if (answer.startsWith('n')) return false;
    return defaultAns;
}

(async () => {
    switch (process.argv[2]) {
        case 'purge':
        case 'clean': {
            if (!process.argv[3] || !fs.existsSync(process.argv[3])) {
                console.error(red(`${error} usage: ${process.argv[1]} purge <file>`));
                process.exit(1);
            }

            await $`eyed3 --remove-all ${process.argv[3]}`;

            console.log(green(`${check} purged all metadata from ${path.basename(process.argv[3])}`));

            break;
        }

        case 'cover': {
            switch (process.argv[3]) {
                case 'attach':
                case 'add':
                case 'set': {
                    if (!process.argv[4] || !fs.existsSync(process.argv[4]) || !process.argv[5] || !fs.existsSync(process.argv[5])) {
                        console.error(red(`${error} usage: ${process.argv[1]} cover attach <mp3> <cover>`));
                        process.exit(1);
                    }

                    await $`eyed3 --add-image=${process.argv[5]}:FRONT_COVER ${process.argv[4]}`;

                    console.log(green(`${check} attached cover to ${path.basename(process.argv[4])}`));

                    break;
                }

                case 'extract':
                case 'get': {
                    if (!process.argv[4] || !fs.existsSync(process.argv[4])) {
                        console.error(red(`${error} usage: ${process.argv[1]} cover extract <mp3>`));
                        process.exit(1);
                    }

                    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mp3-cover-'));

                    await $`eyed3 --write-images=${tmp} ${process.argv[4]}`.quiet();

                    const images = fs.readdirSync(tmp);

                    if (!images.length) {
                        console.error(red(`${error} no cover art found in ${process.argv[4]}`));
                        process.exit(1);
                    }

                    console.log(green(`${check} extracted cover to ${path.join(tmp, images[0])}`));

                    if (await promptYN(`open the extracted cover?`))
                        await $`open ${path.join(tmp, images[0])}`;

                    break;
                }

                default: {
                    console.error(red(`${error} unknown cover command (should be one of "attach", "extract")`));
                    process.exit(1);
                    break;
                }
            }

            break;
        }

        default:
            console.error(red(`${error} unknown command (should be one of "cover", "purge")`));
            process.exit(1);
            break;
    }
})();
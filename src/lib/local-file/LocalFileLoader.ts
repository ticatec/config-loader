import BaseLoader from "../BaseLoader";
import path from "node:path";
import * as fs from "node:fs";

export default class LocalFileLoader extends BaseLoader {

    private root: string;

    /**
     * Create a new LocalFileLoader instance with config directory set to './config'
     */
    constructor() {
        super();
        this.root = `${process.cwd()}/config`;
    }


    /**
     * Load configuration file content from local file system
     * @param fileName - The name of the file relative to the config directory
     * @returns Promise that resolves to the file content as string
     * @protected
     */
    protected loadFile(fileName: string): Promise<string> {
        let file: string = path.resolve(`${this.root}/${fileName}`);
        return new Promise((resolve, reject) => {
            fs.readFile(file, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            })
        })
    }

}
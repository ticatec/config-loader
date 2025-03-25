import BaseLoader from "../BaseLoader";
import path from "node:path";
import * as fs from "node:fs";

export default class LocalFileLoader extends BaseLoader {

    private root: string;

    constructor() {
        super();
        this.root = `${process.cwd()}/config`;
    }


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

import * as fs from 'fs';
import { promisify } from 'util';

const readFileAsync = promisify(fs.readFile)
export async function readJsonFile<T>(filePath: string) {
    try {
        const fileContent: string = await readFileAsync(filePath, 'utf8');
        const jsonData:T[] = JSON.parse(fileContent);
        return jsonData;
    } catch (error) {
        throw error;
    }
}
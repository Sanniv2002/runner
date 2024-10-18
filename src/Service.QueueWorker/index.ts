//Microservice to constantly check the queue for code edits
//And then finally save it on the disk

import { script } from "./script";
import Redis from 'ioredis'
import { updateFile } from "../files";
import fs from "fs/promises"
const fileBasePath = process.env.FILE_BASE_PATH || '/app/files';

type FileArray = [string, string][];

const client = new Redis({
    host: 'cache', // The service name of the Redis container
    port: 6379
  });
let id: NodeJS.Timeout;
let saveTimes = 0

const Service = async () => {
    try{
        const queueKeys = await client.keys("*")
        if(queueKeys.length){
            //This log logic needs to be updated and corrected
            fs.writeFile("log.txt", `Queue Length: ${await client.llen(queueKeys[0])}, Write operations on disk: ${++saveTimes}`)
            const elements = await client.eval(script, queueKeys.length, ...queueKeys) as FileArray
            elements.forEach(element => {
                updateFile(element[0], element[1])
                console.log(`File saved: ${element[0]}`)
            }); 
        }
    } catch (e) {
        console.log(`Unable to save file`)
    }
}

try{
    setInterval(Service, 5000)
} catch (e) {
    console.log(e)
}
//Microservice to constantly check the queue for code edits
//And then finally save it on the disk

import { script } from "./script";
import redis from 'ioredis'
import { updateFile } from "../files";
import fs from "fs/promises"

type FileArray = [string, string][];

const client = redis.createClient();
let id: NodeJS.Timeout;
let saveTimes = 0

const Service = async () => {
    const queueKeys = await client.keys("*")
    if(queueKeys.length){
        //This log logic needs to be updated and corrected
        fs.writeFile("/home/sanniv/Cloud IDE/backend/src/Service.QueueWorker/log.txt", `Queue Length: ${await client.llen(queueKeys[0])}, Write operations on disk: ${++saveTimes}`)
        const elements = await client.eval(script, queueKeys.length, ...queueKeys) as FileArray
        elements.forEach(element => {
            updateFile(element[0], element[1])
        }); 
    }
    setTimeout(Service, 5000)
}

Service()
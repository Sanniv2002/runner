//All HTTP endpoints are in this file

import express from 'express'
import CORS from 'cors'
import Redis from 'ioredis'
import { exec } from 'child_process'
import { createFile, generateFileTree, readFileContents } from './files'

const fileBasePath = process.env.FILE_BASE_PATH || '/app/files';
const app = express()
const client = new Redis({
    host: 'cache', // The service name of the Redis container
    port: parseInt(process.env.REDIS_PORT || "6379", 10)
  });

app.use(CORS())
app.use(express.json())

app.get('/', (_, res) => {
    res.status(200).json({ message: "Server is healthy!" })
})

app.get('/files', async (_, res) => {
    try {
        const fileTree = await generateFileTree(fileBasePath)
        res.json({ tree: fileTree })
    } catch (e) {
        res.status(500).json({ error: e })
    }
})

app.get('/file', async (req, res) => {
    const { filePath } = req.query;

    if (!filePath) {
        return res.status(400).send('File name parameter is missing.');
    }

    try{
        const contents = await readFileContents(filePath as string)
        res.status(200).json({contents: contents, filePath})
    }
    catch(e){
        res.status(400).send("File Not Found")
    }
});

app.get('/run', (_, res) => {
    try{
        exec(`node ${fileBasePath}`, (error, stdout, stderr) => { //Path needs to updated when deployed
            if (error) {
                res.status(200).send(error.message)
                return;
            }
            if (stderr) {
                res.status(200).send(`stderr: ${stderr}`)
                return;
            }
            res.status(200).json(stdout)
        });
    }
    catch(e){
        res.status(400).send("Unexpected error occured")
    }
})

app.put('/code', async (req, res) => {
    try{
        const { code, filePath } = req.body
        //await updateFile(filePath, code)
        await client.lpush(filePath, code)
        res.status(200).json({
            message: "Added to queue will be processed"
        })
    }
    catch(e){
        res.status(400).send("Unexpected error occured")
    }
})

app.post('/new', async (req, res) => {
    try {
        const { fileName } = req.body
        const fullFilePath = `${fileBasePath}/${fileName}`;
        await createFile(fullFilePath)
        res.status(200).send("File Created Successfully")
    } catch (e) {
        res.status(400).send("Unexpected error occurred")
    }
});

export default app
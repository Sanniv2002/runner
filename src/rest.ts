//All HTTP endpoints are in this file

import express from 'express'
import CORS from 'cors'
import redis from 'ioredis'
import { exec } from 'child_process'
import { createFile, generateFileTree, readFileContents, updateFile } from './files'

const app = express()
const client = redis.createClient();

app.use(CORS())
app.use(express.json())

app.get('/files', async (_, res) => {
    try {
        const fileTree = await generateFileTree("../user")
        res.json({ tree: fileTree })
    } catch (error) {
        res.status(500).json({ error: "Internal server error" })
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
        exec('node ../user/index.js', (error, stdout, stderr) => { //Path needs to updated when deployed
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
        await updateFile(filePath, code)
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
    try{
        const { filePath } = req.body
        await createFile(filePath)
        res.status(200).send("File Created Succesfully")
    }
    catch(e){
        res.status(400).send("Unexpected error occured")
    }
})

export default app
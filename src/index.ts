import express from 'express'
import CORS from 'cors'
import { WebSocketServer } from 'ws'
import fs from 'fs/promises';
import path from 'path';
import * as pty from 'node-pty'
import { exec } from 'child_process'

interface FileTreeNode {
    name: string;
    type: 'directory' | 'file';
    filePath: string; // Add filePath property
    children?: FileTreeNode[];
}

const PORT = process.env.PORT || 8000

const app = express()
app.use(CORS())
app.use(express.json())

var ptyProcess = pty.spawn('bash', [], {
  name: 'xterm-color',
  cols: 120,
  rows: 30,
  cwd: '../user',
  env: process.env
});

const httpServer = app.listen(PORT, () => {
    console.log(`Server started at port ${PORT}`)
})

const wss = new WebSocketServer({server: httpServer})

wss.on('connection', ws => {
    let userCommand = 'cd ../ && cd user' + '\r'

    //init commands for dev purposes
    exec('cd ../ && mkdir user && cd user && touch index.js && npm init -y')
    ptyProcess.write('cd ../ && cd user' + '\r')
    
    ws.on('message', data => {
        try {
            if(data.toString().includes('sudo') || data.toString().includes('rm -r user') || data.toString().includes('rm index.js') || data.toString().includes('rm package.json')){
                ptyProcess.write("\r");
            }
            else{
                ptyProcess.write(data.toString() + "\r");
                userCommand = data.toString()
            }
        } catch (error) {
            ws.send(`Error: ${error}`);
        }
    });
    ptyProcess.onData(data => {
        try {
            ws.send(data.toString().replace(userCommand, ''));
        } catch (error) {
            console.error('Error sending data to WebSocket client:', error);
        }
    });
});

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
        await fs.access(filePath as string, fs.constants.R_OK | fs.constants.W_OK)
        const contents = await fs.readFile(filePath as string, { encoding: 'utf8' });
        res.status(200).json({code: contents, filePath})
    }
    catch(e){
        res.status(400).send("File Not Found")
    }
});

app.get('/run', (_, res) => {
    try{
        ptyProcess.write('node index.js' + '\r')
        res.status(200).send("Executed Succesfully")
    }
    catch(e){
        res.send(400).send("Unexpected error occured")
    }
})

app.put('/code', async (req, res) => {
    try{
        const { code, filePath } = req.body.data
        await fs.access(filePath as string, fs.constants.R_OK | fs.constants.W_OK)
        await fs.writeFile(filePath as string, code)
        res.send(200)
    }
    catch(e){
        res.status(400).send("Unexpected error occured")
    }
})

async function generateFileTree(dirPath: string): Promise<FileTreeNode[]> {
    const files: string[] = await fs.readdir(dirPath);
    const fileTree: FileTreeNode[] = [];

    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);

        const node: FileTreeNode = {
            name: file,
            type: stats.isDirectory() ? 'directory' : 'file',
            filePath: filePath, // Set filePath property
        };

        if (stats.isDirectory()) {
            node.children = await generateFileTree(filePath);
        }

        fileTree.push(node);
    }

    return fileTree;
}

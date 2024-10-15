import { WebSocketServer } from 'ws'
import ptyProcess from './pty'
import app from './rest'
import handleWebSocket from './ws'

const PORT = 8000

const httpServer = app.listen(PORT, () => {
    console.log(`Server listening on PORT ${PORT}`)
})

const wss = new WebSocketServer({server: httpServer})

const wsServer = handleWebSocket(wss, ptyProcess)
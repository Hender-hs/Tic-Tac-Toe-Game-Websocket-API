import WebSocket, { WebSocketServer } from 'ws'
import WebsocketController from './src/controller/index.controller'
import 'dotenv/config'

const wss = new WebSocketServer({ port: 8080 });

const initiateWSS = () => {
  	const websocketManager = new WebsocketController(wss, WebSocket)
  	websocketManager.init()
}
initiateWSS()

console.log("running on port ", 8080)
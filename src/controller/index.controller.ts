import { string } from 'yup'
import APIServices from '../services/index.services'
import Validations from '../validators/validations.validator'


class WebsocketController implements WebsocketControllerClass {

	"wss": any
	"ws": any
	"WebSocketInstance": any
	"API_URL": string
	"response": any
	"rooms": Array<any>

	constructor(wsServer: any, WebSocketInstance: any) {
		this.wss = wsServer
		this.WebSocketInstance = WebSocketInstance
		this.API_URL = String(process.env.API_URL)
		this.rooms = []
	}


	private clientAsyncReqId(client: any): number {
		const asyncIdSymbol = () => {
			const senderSocket = client._socket
			const allSymbols = Object.getOwnPropertySymbols(senderSocket)
			const asyncIdSymbol: Symbol | any = allSymbols.find((smbl: Symbol) => smbl.toString() === 'Symbol(async_id_symbol)')
			return asyncIdSymbol
		}
		const asyncId = client._socket[asyncIdSymbol()]
		return asyncId
	}


	/**
	 * This function manages all processes required to index
	 * all connected users in the websocket server.
	 * 
	 * @param userId - string -> User websocket client's id
	 * @returns - void
	 */
	private indexClientSender(userUuid: string, parsedMessage: any) {

		const clientsMap = this.wss.clients

		const allClients: Array<any> = Array.from(clientsMap.values())

		const clientAlreadyIndexed = allClients.find((client: any) => client.uuid === userUuid)

		if (clientAlreadyIndexed) return

		/**
		 * This function sets the user uuid inside of websocket's client object tree. 
		 * 
		 * @returns any
		 */
		const setClientUuid = () => this.wss.clients.forEach((client: any, key: any) => {

			if (client.uuid || parsedMessage.cnn_session_id !== this.clientAsyncReqId(client)) return
			client.uuid = userUuid
		})

		setClientUuid()
	}

	
	private sendError(stringMessage: string) {
		const error = { "error": stringMessage }
		this.ws.send(JSON.stringify(error))
	}

	
	private sendResponse(isBinary: any) {

		// get the room info so that can send to the correct users
		const relatedRoom = this.rooms[this.response.data.room_id || this.response.data._id] // in getRoomStateReq, the room's id come with "_id" key


		// TODO: handle and send to user when a response for a error errors
		let stringifiedResponse = JSON.stringify(this.response)

		this.wss.clients.forEach((client: any) => {

			// excluding the websocket connection itself and those who's not related to the room
			if (!relatedRoom || client.uuid === undefined) return

			
			if (relatedRoom['host_id'] === client.uuid || relatedRoom['guest_id'] === client.uuid) {				
				
				if (client.readyState === this.WebSocketInstance.OPEN) {
					client.send(stringifiedResponse, { binary: isBinary });
				}
			}
		})
	}

	
	private async makeAPIRequest(parsedMessage: any, APIService: APIServices) {

		if (parsedMessage.type === 'add_move') {
			this.response = await APIService.addMoveRequest(parsedMessage)
		}
		
		if (parsedMessage.type === 'add_guest') {

			this.response = await APIService.addGuestRequest(parsedMessage)

			// set the room guest in the ws state
			this.rooms[this.response.data.room_id] = this.response.data.room
		}
	
		if (parsedMessage.type === 'get_room_state') {
			this.response = await APIService.getRoomStateRequest()
		}

		if (parsedMessage.type === 'create_room') {
			this.response = await APIService.createRoomRequest(parsedMessage)
			this.rooms[this.response.data._id] = this.response.data
		}
	}


	private async messageHandler(data: any, isBinary: any) {

		const parsedMessage: any = JSON.parse(data)

		const isValidForm = await new Validations(parsedMessage).validate()

		if(!isValidForm) {
			this.sendError('Invalid body form')
			return
		}

		const {host_id, guest_id} = parsedMessage
		this.indexClientSender(host_id || guest_id, parsedMessage)

		const APIService = new APIServices(this.API_URL, parsedMessage)

		await this.makeAPIRequest(parsedMessage, APIService)

		this.sendResponse(isBinary)
	}



	private connectionHandler(ws: any) {
		this.ws = ws

		const sendCnnIdSession = () => {
			const cnnId =  this.clientAsyncReqId(ws)
			ws.send(JSON.stringify({"cnn_session_id": cnnId}))
		}
		sendCnnIdSession()
		
		ws.on('message', this.messageHandler.bind(this))
	}



	public init() {
		this.wss.on('connection', this.connectionHandler.bind(this))
	}
}

export default WebsocketController
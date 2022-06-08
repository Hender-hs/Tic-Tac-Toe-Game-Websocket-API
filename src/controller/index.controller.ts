import APIServices from '../services/index.services'
import Validations from '../validators/validations.validator'

class WebsocketController implements WebsocketControllerClass {

	"wss": any
	"ws": any
	"WebSocketInstance": any
	"API_URL": string
	"response": any

	constructor(wsServer: any, WebSocketInstance: any) {
		this.wss = wsServer
		this.WebSocketInstance = WebSocketInstance
		this.API_URL = String(process.env.API_URL)
	}

	/**
	 * This function manages all processes required to index
	 * all connected users in the websocket server.
	 * 
	 * @param userId - string -> User websocket client's id
	 * @returns - void
	 */
	private indexClientSender(userId: string) {

		const clientsMap = this.wss.clients

		const allClients: Array<any> = Array.from(clientsMap.values())

		const clientAlreadyIndexed = allClients.find((client: any) => client.uuid === userId)

		if (clientAlreadyIndexed) return


		/**
		 * This function sets the user uuid inside of websocket's client object tree. 
		 * 
		 * @returns any
		 */
		const setClientId = () => clientsMap.forEach((client: any, key: any) => {

			if (client.uuid !== undefined) return

			Object.defineProperty(client, 'uuid', {
				"value": userId,
				"writable": false,
				"enumerable": true
			})
		})

		setClientId()
	}

	
	private sendError(stringMessage: string) {
		const error = { "error": stringMessage }
		this.ws.send(JSON.stringify(error))
	}

	
	private sendResponse(isBinary: any) {

		const stringifiedResponse = JSON.stringify(this.response)

		this.wss.clients.forEach((client: any) => {

			if (client.readyState === this.WebSocketInstance.OPEN) {
				client.send(stringifiedResponse, { binary: isBinary });
			}
		})
	}

	
	private async makeAPIRequest(parsedMessage: any, APIService: any) {

		if (parsedMessage.type === 'add_move') {
			this.response = await APIService.addMoveRequest(parsedMessage)
		}
		
		if (parsedMessage.type === 'add_guest') {
			this.response = await APIService.addGuestRequest(parsedMessage)
		}
	
		if (parsedMessage.type === 'get_room_state') {
			this.response = await APIService.getRoomStateRequest()
		}
	}


	private connectionHandler(ws: any) {
		this.ws = ws
		ws.on('message', this.messageHandler.bind(this))
	}


	private async messageHandler(data: any, isBinary: any) {

		const parsedMessage: any = JSON.parse(data)

		const isValidForm = await new Validations(parsedMessage).validate()

		if(!isValidForm) {
			this.sendError('Invalid body form')
			return
		}

		this.indexClientSender(parsedMessage.user_id)

		const APIService = new APIServices(this.API_URL, parsedMessage)

		await this.makeAPIRequest(parsedMessage, APIService)

		this.sendResponse(isBinary)
	}

	
	public init() {
		this.wss.on('connection', this.connectionHandler.bind(this))
	}
}

export default WebsocketController
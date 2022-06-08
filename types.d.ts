interface WebsocketControllerClass {
	init(): void
}

interface APIServiceClass {
	getRoomStateRequest(): Promise<ResponseBody>
	addGuestRequest(data: addGuestPayload): Promise<ResponseBody>
	addMoveRequest(data: addMovePayload) : Promise<ResponseBody>
}

interface ResponseBody {
	"data": any
	"status": any
	"error": boolean
}

type addMovePayload = {
	"type"?: string
	"user_move_id": string,
	"a1"?: number, 
	"a2"?: number, 
	"a3"?: number,
	"b1"?: number, 
	"b2"?: number, 
	"b3"?: number,
	"c1"?: number, 
	"c2"?: number, 
	"c3"?: number,
}

type addGuestPayload = {
	"type"?: string,
	"room_id"?: string,
	"guest": any,
	"guest_id": string
}

type WhichSchema = 'add_move' | 'add_guest' 

interface ValidationsMethods {
	validateAddMove(payload: addMovePayload): boolean
	validateAddGuest(payload: addGuestPayload): boolean
	validate(): boolean
}
import axios, { Axios } from 'axios'

class APIServices implements APIServiceClass {
	
	"URL": string
	"responseData": ResponseBody
	"responseError": ResponseBody
	"objectMessage": any
	"axiosInstance": any

	constructor(URL: string, objectMessage: any) {
		this.URL = URL
		this.objectMessage = objectMessage
		this.axiosInstance = this.setAxiosInstance()
	}

	private setAxiosInstance () {
		const axiosInstance = axios.create({
			"baseURL": this.URL,
			"headers": {
				"Content-Type": 'application/json'
			}
		})
		return axiosInstance
	}

	private async requestAPI(method: string, url: string, data?: any) {
		try {
			const response = await this.axiosInstance({
				method,
				url, 
				data
			})

			this.responseData = { 
				"error": false, 
				"data": response.data, 
				"status": response.status 
			}

		} catch(error: any) {
			console.error('error: ', error)

			this.responseError = { 
				"error": true, 
				"data": error.response.data, 
				"status": error.response.status 
			}
		}
		
		return this.responseData || this.responseError
	}

	public async getRoomStateRequest() {
		const response = await this.requestAPI('GET', `/rooms/${this.objectMessage.room_id}`)
		return response
	}

	public async addGuestRequest(data: addGuestPayload) {
		const response = await this.requestAPI('POST', `/rooms/${this.objectMessage.room_id}/add_guest`, data)
		return response
	}

	public async addMoveRequest(data: addMovePayload) {
		const response = await this.requestAPI('POST', `/rooms/${this.objectMessage.room_id}/add_moves`, data)
		return response
	}
}

export default APIServices
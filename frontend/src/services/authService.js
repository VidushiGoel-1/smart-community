
import api from "../axios/api"
import endpoints from "../axios/endpoints"
const authService={


    register:async(req)=>{

        const response=await api.post(endpoints.REGISTER , req)
        

        return response.data
    }
}

export default authService
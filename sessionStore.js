class SessionStore{
    findSession(id){}
    saveSession(id, session){}
    removeSession(id){}
    findAllSession(){}
}

class InMemorySessionStore extends SessionStore{
    constructor(params) {
        super()
        this.sessions = new Map()
    }

    findSession(id){
        return this.sessions.get(id)
    }

    saveSession(id, session){
        return this.sessions.set(id, session)
    }

    removeSession(id){
        
        return this.sessions.delete(id)
    }


    findAllSession(){
        // console.log("IN all sessions", this.sessions)
        return [...this.sessions.values()]
    }
}

module.exports = {
    InMemorySessionStore
}
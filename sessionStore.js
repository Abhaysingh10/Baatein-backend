class SessionStore{
    findSession(id){}
    saveSession(id, session){}
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
        // console.log("id", id)
        // console.log("session in class", session)

        return this.sessions.set(id, session)
    }

    findAllSession(){
        // console.log("IN all sessions", this.sessions)
        return [...this.sessions.values()]
    }
}

module.exports = {
    InMemorySessionStore
}
const users = []

// addUser, removeUser, getUser, getUsersInRoom


/**
 * 
 * @param {*} id  - socket ID
 * @param {*} username  - username
 * @param {*} room  - the user's room
 * @returns - error message if username and room are empty, otherwise 
 */
const addUser = ({id, username, room}) => {
    // Clean the data

    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()


    // Validate the data
    if ( !username || !room ){
        return {
            error: 'username and room are required'
        }
    }

    // Check for existing user
    const existingUser = users.find((user)=>{
        // If both are true, this means we have an existing user
        return user.room === room && user.username  === username
    })

    // validate username

    if (existingUser) {
        return {
            error: 'Username is in use!'
        }
    }

    // Store user
    const user = { id, username, room }
    users.push(user)
    return { user }
}


const removeUser = (id) =>{
    const index = users.findIndex((user)=> user.id === id)

    // That means we found a match , let's remove
    if(index !== -1){
        return users.splice(index, 1)[0]
    }
}

/**
 * 
 * @param {socket} id - socket id to find the associated user 
 * @returns 
 */
const getUser = (id) =>{
    return users.find((user)=> user.id === id)
}

const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase()
    return users.filter((user)=> user.room == room)
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
express = require('express')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, getUser, getUsersInRoom, removeUser } = require('./utils/users')


const app = express()
const server = http.createServer(app) // raw http server required for socket io

const io = new socketio.Server(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname,'../public')

// Serve up directory
app.use(express.static(publicDirectoryPath))

let msg = "Welcome!"

// Each user creates a new connection with their own 'socket'
io.on('connection',(socket)=>{
    console.log('New WebSocket connection')

    socket.on('join',(options, callback)=>{
        const {error, user} = addUser({id: socket.id, ...options })

        if (error) {
            // Let the client know what went wrong
            return callback(error)
        }


        // This emits events only to that room
        socket.join(user.room) //server-side only

        // Sends count data to the clients
        socket.emit('message', generateMessage('Admin', 'Welcome'))

        // Sends data to all clients connected except the sender, and to that room only
        socket.broadcast.to(user.room).emit('message', generateMessage('Adimn',`${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room),
        })

        callback(undefined)
    })

    socket.on('sendMsg', (userInput, callback)=>{
        const filter = new Filter()

        if(filter.isProfane(userInput)){
            return callback('Profanity is not allowed')
        }
        const user = getUser(socket.id)
        // Send the message to only the clients still connected
        io.to(user.room).emit('message', generateMessage(user.username, userInput))
        callback(undefined, 'Delivered!')
    })


    // The callback function here serves as acknowledgement
    socket.on('sendLocation', (geoData, callback)=>{
        const { longitude, latitude } = geoData
        const user = getUser(socket.id)
        url = `https://google.com/maps?q=${latitude},${longitude}`
        
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username, url))
        callback()
    })
    

    socket.on('disconnect', ()=>{
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message', generateMessage(`${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room),
            })
        }
    })

})



// make sure we spin up the server running socket io
server.listen(port, ()=>{
    console.log(`listening on port ${port}`)
}) 
const socket = io();


// Elements, using $name is convention to separate js variables, from vars from the dom
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')


// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML


// Options
// Let's us parse out the room and display name
const {username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })


const autoscroll = () =>{
    // New message element
    const $newMessage = $messages.lastElementChild // Last element message as a child

    // Height of the last message 
    // We don't want fixed values, get it based on what the height is relative to the browser
    const newMessageStyles = getComputedStyle($newMessage) // Global browser function
    const newMessageMargin = parseInt(newMessageStyles.marginBottom) 
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin // Total height


    // Visible Height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight // Gives us total height we can scroll through
    
    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    // Make sure we were at the bottom already, if so, do not autoscroll
    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}


socket.on('message', (message)=>{
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        createdAt: moment(message.createdAt).format('h:mm a'),
        message: message.text,
    })

    // We insert the messages id right before the end of the div inside of this template
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('countUpdated',(count)=>{
    console.log('the count has been updated!', count);
})

socket.on('locationMessage', (url)=>{
    console.log(url)
    const html = Mustache.render(locationTemplate, {
        username: url.username,
        createdAt: moment(url.createdAt).format('h:mm a'),
        url: url.text,
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})


// Room List 
socket.on('roomData', ({room, users})=>{
    const html = Mustache.render(sidebarTemplate, {
        room,
        users,
    })
    document.querySelector('#sidebar').innerHTML = html

})

// Grab the ID of the button
$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault() // We don't want the page reloading

    // Disable the form, to prevent accidental double clicks
    // Retrieve all the form elements
    $messageFormButton.setAttribute('disabled', 'disabled')
    const message = e.target.elements.message.value

    socket.emit("sendMsg",message, (error)=>{

        // Enable the form
        $messageFormButton.removeAttribute('disabled')

        // Clear the previous message
        $messageFormInput.value = ''

        // Keep the cursor within the chat input bar, allowing continous input
        $messageFormInput.focus()

        if (error){
            return console.log(error)
        }
        console.log('A message was delivered', message)

    })
})

$locationButton.addEventListener('click', ()=>{
    if(!navigator.geolocation) {
        return alert('geolocation is not supported by your browser.')
    }
    $locationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position)=> {
        console.log(position.coords.latitude)
        socket.emit('sendLocation', { longitude: position.coords.longitude , latitude: position.coords.latitude }, ()=>{
            console.log('Location Shared!')
            $locationButton.removeAttribute('disabled')
        } )
    })

})


socket.emit('join', { username, room }, (error)=>{
    if(error){
        alert(error)
        location.href = '/'
    }
})
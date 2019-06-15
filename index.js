const express = require('express');
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const mongo = require('mongodb').MongoClient; 
const PORT = process.env.PORT;
const SOCKET_PORT= process.env.SOCKET_PORT;
const client = require('socket.io').listen(SOCKET_PORT).sockets;
app.use(express.static('./public/')); 
const dbUrl = process.env.DB_HOST;
const dbName = process.env.DB_NAME;


mongo.connect(dbUrl, (err, db)=>{
    if (err) {
        throw err
    }
    console.log('Connected to Database successfully');
    //Connect to socket.io
    client.on('connection', (socket)=>{
        let chat = db.db(dbName).collection("chats");

        //create function to send status 
        sendStatus = (s) =>{
            socket.emit('status', s);
        }

        //Get chats from mongo collection
        chat.find().limit(100).sort({_id: 1}).toArray((err, res)=>{
            if (err) {
                throw err;
            }

            //Emit the messages
            socket.emit('output', res);
        });

        //Handle input events 
        socket.on('input', (data)=>{
            let name = data.name;
            let message = data.message;

            //check for name and message 
            if (name == '' || message == '') {
                //Send error status
                sendStatus('Please enter a name and message ');
            } else{
                //Insert message 
                chat.insertOne({
                    name: name,
                    message: message
                }, ()=>{
                    client.emit('output', [data]);

                    //Send status object
                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    });
                });
            }
        });
        //Handle clear 
        socket.on('clear', (data)=>{
            //Remove all chat from collection
            chat.deleteMany({}, ()=>{
                //Emit cleared
                socket.emit('cleared');
            })
        })
    });
});

app.listen(PORT, ()=>{
    console.log('Server listening on 4001');
})
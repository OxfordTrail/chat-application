const express = require('express');
const app = express();
const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;
const dotenv = require('dotenv');
dotenv.config();
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
            let messages = data.messages;

            //check for name and message 
            if (name == '' || message == '') {
                //Send error status
            } else{
                //Insert message 
                chat.listen({
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
            chat.remove({}, ()=>{
                //Emit cleared
                socket.emit('cleared');
            })
        })
    });
});

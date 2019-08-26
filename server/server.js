const express = require('express');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require("path");
const port = process.env.PORT || 3000;
let clientsAndWorkers = new Map();
const { Worker } = require("worker_threads");

app.get('/', function(req, res){
    res.sendFile(path.join(__dirname, '..', 'static/html/index.html'));
});

app.use(express.static("../static"));

function callBack(incoming, id) {
    if (incoming.cmd == "generateDone") {
        io.to(id).emit('generateDone', {data: incoming.data});
    } else if (incoming.cmd == "initDone") {
        io.to(id).emit('initDone', {data: id});
    }
}

io.on('connection', function(socket){
    console.log('a client connected');

    socket.on('disconnect', function(){
        console.log('a client disconnected');
        clientsAndWorkers.delete(socket.id);
        socket.disconnect(true);
    });

    socket.on('initialize', function(id){
        let workerData = socket.id;
        const worker = new Worker("./modelWorker.js", { workerData });
        clientsAndWorkers.set(socket.id, worker);
        worker.on("message", incoming => callBack(incoming, socket.id));
        worker.on("error", code => new Error(`Worker error, code ${code}`));
        worker.on("exit", code =>
            console.log(`Worker stopped with exit code ${code}`));
      });

    socket.on('generate', function(msg){
        clientsAndWorkers.get(msg.id).postMessage(JSON.stringify(msg));
    });
});

http.listen(port, function(){
    console.log('listening on *:3000');
});
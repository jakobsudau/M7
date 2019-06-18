class Connector {
    constructor(generator) {
        this.socket;
        this.parent = generator;
    }

    initialize(id) {
        return new Promise(function(resolve, reject) {
            if (isElectron) {
                electron.ipcRenderer.send('initialize',
                    {cmd: "initialize", id: id});
                electron.ipcRenderer.on('status', (event, threads, tasks) => {
                        let id =  Math.random().toString(36).substring(7);
                        let test = 'to-renderer' + id;
                        electron.ipcRenderer.on(test, (event, arg) => {
                            this.parent.generateSequenceCallback(arg);
                        });
                        resolve({data: id});
                });
            } else {
                this.socket = io();
                this.socket.emit('initialize', 0);
                this.socket.on('initDone', function(msg){resolve(msg)});
                this.socket.on('generateDone', function(msg){
                    this.parent.generateSequenceCallback(msg);
                }.bind(this));
            }
        }.bind(this));
    }

    generateSequence(data) {
        if (isElectron) {
            electron.ipcRenderer.send('assign-task', data);
        } else {
            this.socket.emit('generate', data);
        }
    }

    delete() {
        if (!isElectron) {
            this.socket.disconnect();
        }
        delete this.socket;
    }
}
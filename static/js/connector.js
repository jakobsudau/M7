class Connector {
    constructor(module) {
        this.socket;
        this.parent = module;
        this.id;
        this.ipcRenderer;
        this.once = true;
        this.isElectron =
            navigator.userAgent.toLowerCase().indexOf(' electron/') > -1;
    }

    initialize(id) {
        return new Promise(function(resolve, reject) {
            if (this.isElectron) {
                this.ipcRenderer = require('electron').ipcRenderer;
                if (id == 0) {
                    // support for native dark mode on macOS
                    this.ipcRenderer.once('to-GlobalControlsModule', (evt, arg) => {
                        console.log(this.parent);
                        this.parent.switchDarkMode(arg)});
                    resolve({data: id});
                } else {
                    this.ipcRenderer.send('initialize');
                    this.ipcRenderer.once('status',
                    (event, threads, tasks) => {
                        if (this.once) {
                            this.once = false;
                            this.id =  Math.random().toString(36).substring(7);
                            resolve({data: this.id});
                        }
                    });
                }
            } else {
                if (id != 0) {
                    if (id == 1) {
                        let socketScript = document.createElement("script");
                        socketScript.type = "text/javascript";
                        socketScript.src = "/socket.io/socket.io.js";
                        socketScript.addEventListener("load", function() {
                            console.log("done loading");
                            this.socket = io();
                            this.socket.emit('initialize', 0);
                            this.socket.on('initDone', function(msg){resolve(msg)});
                        }.bind(this));
                        document.getElementById("mainContainer").appendChild(socketScript);
                    } else {
                        this.socket = io();
                        this.socket.emit('initialize', 0);
                        this.socket.on('initDone', function(msg){resolve(msg)});
                    }
                }
            }
        }.bind(this));
    }

    generateSequence(data) {
        return new Promise(function(resolve, reject) {
            if (this.isElectron) {
                this.ipcRenderer.send('generate-sequence', data);
                let test = 'to-connector' + this.id;
                this.ipcRenderer.once(test, (event, arg) => {
                    resolve(arg);
                });
            } else {
                this.socket.emit('generate', data);
                this.socket.on('generateDone', function(msg){
                    resolve(msg);
                }.bind(this));
            }
        }.bind(this));
    }

    delete(id) {
        if (this.isElectron) {
            this.ipcRenderer.send('delete', id);
        } else {
            this.socket.disconnect();
        }
        delete this.socket;
    }
}
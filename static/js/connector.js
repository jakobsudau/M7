class Connector {
    constructor(module) {
        this.socket;
        this.parent = module;
        this.id;
        this.once = true;
        this.isElectron =
            navigator.userAgent.toLowerCase().indexOf(' electron/') > -1;
    }

    initialize(id) {
        return new Promise(function(resolve, reject) {
            if (this.isElectron) {
                if (id == 0) {
                    // support for native dark mode on macOS
                    electron.ipcRenderer.on('to-mainModule', (evt, arg) => {
                        this.parent.switchDarkMode(arg)});
                    resolve({data: id});
                } else {
                    electron.ipcRenderer.send('initialize',
                    {cmd: "initialize", id: id});
                    electron.ipcRenderer.on('status',
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
                    this.socket = io();
                    this.socket.emit('initialize', 0);
                    this.socket.on('initDone', function(msg){resolve(msg)});
                }
            }
        }.bind(this));
    }

    generateSequence(data) {
        return new Promise(function(resolve, reject) {
            if (this.isElectron) {
                electron.ipcRenderer.send('assign-task', data);
                let test = 'to-renderer' + this.id;
                electron.ipcRenderer.on(test, (event, arg) => {
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
            electron.ipcRenderer.send('delete', id);
        } else {
            this.socket.disconnect();
        }
        delete this.socket;
    }
}
const {ipcMain, BrowserWindow, app} = require('electron');
const cpus = require('os').cpus().length;
console.log('cpus: ' + cpus);

// stack of available background threads
var available = [];

// queue of tasks to be done
var tasks = [];

// hand the tasks out to waiting threads
function doIt() {
    while (available.length > 0 && tasks.length > 0) {
        var task = tasks.shift();
        available.shift().send(task[0], task[1]);
    }
    main.webContents.send('status', available.length, tasks.length);
}

// Create a hidden background window
function createBgWindow() {
    result = new BrowserWindow({
        "show": false,
        webPreferences: {
            nodeIntegration: true,
            backgroundThrottling: false
        }
    });
    result.loadURL('file://' + __dirname + '/electron/background.html');
    result.on('closed', () => {
        console.log('background window closed');
    });
    return result;
}

app.on('ready', function() {
    // Create main window which contains the visible UI
    main = new BrowserWindow({
        "width": 736,
        "height": 680,
        //"icon": __dirname + "/icon/icon.icns",
        titleBarStyle: 'hidden',
        webPreferences: {
            nodeIntegration: true,
            backgroundThrottling: false,
            webSecurity: false
        }
    });
    main.webContents.openDevTools();
    main.loadURL('file://' + __dirname + '/static/indexElectron.html');
    main.show();
    main.webContents.on('did-finish-load', () => {
        main.webContents.send('test','This is a test');
      })
      main.on('closed', () => {
        // call quit to exit, otherwise the background
        // windows will keep the app running
        app.quit();
    })

    // Main thread can receive directly from windows
    ipcMain.on('to-main', (event, arg) => {
        console.log(arg);
    });

    // Windows can talk to each other via main
    ipcMain.on('for-renderer', (event, arg) => {
        console.log("got generated data from bg thread, send it to " +
            "generator " + arg.id);
        main.webContents.send(('to-renderer' + arg.id), arg);
    });

    ipcMain.on('for-background', (event, arg) => {
        tasks.push(['message', arg]);
        doIt();
    });

    // heavy processing done in the background thread
    // so UI and main threads remain responsive
    ipcMain.on('assign-task', (event, arg) => {
        tasks.push(['task', arg]);
        doIt();
    });

    ipcMain.on('initialize', (event, arg) => {
        if (available.length < cpus) {
            createBgWindow();
        }
    });

    ipcMain.on('delete', (event, arg) => {
        // delete bgWindow / thread
    });

    ipcMain.on('ready', (event, arg) => {
        available.push(event.sender);
        console.log("bg thread is ready");
        doIt();
    })
})
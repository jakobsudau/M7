const {ipcMain, BrowserWindow, app, systemPreferences, dialog} = require('electron');
const fs = require('fs');
const cpus = require('os').cpus().length;
let backgroundWindows = [];
console.log('cpus available: ' + cpus);

// stack of available background threads
var available = [];

// queue of tasks to be done
var tasks = [];

// hand the tasks out to waiting threads
function executeTask() {
    while (available.length > 0 && tasks.length > 0) {
        var task = tasks.shift();
        available.shift().send(task[0], task[1]);
    }
    main.webContents.send('status', available.length, tasks.length);
}

// create a hidden background window
function createBackgroundProcessWindow() {
    result = new BrowserWindow({
        "show": false,
        webPreferences: {
            nodeIntegration: true,
            backgroundThrottling: false,
        }
    });
    result.loadURL('file://' + __dirname + '/backgroundProcess.html');
    result.on('closed', () => {
        console.log('background window closed');
        result = null;
    });
    return result;
}

app.on('ready', function() {
    // create main window which contains the visible UI
    main = new BrowserWindow({
        "width": 736,
        "height": 680,
        "minWidth": 414,
        "minHeight": 354,
        //"icon": __dirname + "/icon/icon.icns",
        titleBarStyle: 'hidden',
        webPreferences: {
            nodeIntegration: true,
            backgroundThrottling: false,
        }
    });
    main.webContents.openDevTools();
    main.loadURL('file://' + __dirname + '/../static/html/index.html');
    main.show();
    // call quit to exit, otherwise background windows keep app running
    main.on('closed', () => {app.quit()})

    // support for native dark mode on macOS
    if (process.platform == 'darwin') {
        systemPreferences.subscribeNotification(
            'AppleInterfaceThemeChangedNotification',
            function theThemeHasChanged () {
                main.webContents.send(('to-GlobalControlsModule'),
                    systemPreferences.isDarkMode());
            }
        );
    }

    // main thread can receive directly from windows
    ipcMain.on('to-main', (event, arg) => {
        console.log(arg);
    });

    // windows can talk to each other via main
    ipcMain.on('for-renderer', (event, arg) => {
        main.webContents.send(('to-connector' + arg.id), arg);
    });

    // music generation to be done in background thread
    ipcMain.on('generate-sequence', (event, arg) => {
        tasks.push(['generate-task', arg]);
        executeTask();
    });

    ipcMain.on('initialize', (event, arg) => {
        backgroundWindows.push(createBackgroundProcessWindow());
    });

    ipcMain.on('save', (event, arg) => {
        dialog.showSaveDialog((fileName) => {
            if (fileName === undefined){
                console.log("You didn't save the file");
                return;
            }

            // fileName is a string that contains the path and
            // filename created in the save file dialog.
            fs.writeFile(fileName + ".json", JSON.stringify(arg), (err) => {
                if(err){
                    console.log("An error ocurred creating " +
                    "the file " + err.message);
                }

                console.log("The file has been succesfully saved");
            });
        });
    });

    ipcMain.on('delete', (event, arg) => {
        // delete bgWindow / thread
        backgroundWindows.pop().close();
    });

    ipcMain.on('ready', (event, arg) => {
        available.push(event.sender);
        console.log("bg thread is ready");
        executeTask();
    })
})
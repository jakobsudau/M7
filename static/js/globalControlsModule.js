// -------------------------------------------------------------------------
// GlobalControls
// -------------------------------------------------------------------------

class GlobalControlsModule {
    constructor(mainModule, darkmode = false, barPosition = 0) {
        if (!!GlobalControlsModule.instance) {
            return GlobalControlsModule.instance;
        }

        document.documentElement.setAttribute('theme', 'light');
        GlobalControlsModule.instance = this;
        this.isDarkMode = darkmode;
        this.barPositions = ["left", "top", "right", "bottom"]
        this.barPosition = barPosition;
        this.darkModeButton;
        this.positionButton;
        this.createUIElements(mainModule);

        this.connector = new Connector(this);
        this.connector.initialize(0);
    }

    switchBarPosition(position) {
        const mainSubCon = document.getElementById("modulesContainer");
        const mainCon = document.getElementById("mainContainer");
        switch (this.barPositions[position]) {
            case "left":
                this.positionButton.innerHTML = "◧";
                globalControlsModuleContainer.className = "left";
                mainSubCon.className = "modulesContainerLeftRight";
                mainCon.insertBefore(globalControlsModuleContainer,
                    mainCon.childNodes[0]);
                break;
            case "top":
                this.positionButton.innerHTML = "⬒";
                globalControlsModuleContainer.className = "top";
                mainSubCon.className = "modulesContainerTopBottom";
                break;
            case "right":
                this.positionButton.innerHTML = "◨";
                globalControlsModuleContainer.className = "right";
                mainSubCon.className = "modulesContainerLeftRight";
                break;
            case "bottom":
                this.positionButton.innerHTML = "⬓";
                globalControlsModuleContainer.className = "bottom";
                mainSubCon.className = "modulesContainerTopBottom";
                mainCon.appendChild(globalControlsModuleContainer);
                break;
        }
    }

    showHelp() {
        const modulesContainer = document.getElementById("modulesContainer");
        const globalControlsModuleContainer =
            document.getElementById("globalControlsModuleContainer");
        const overlayContainer = document.getElementById("overlayContainer");
        if (overlayContainer.style.display == "block") {
            overlayContainer.style.display = "none";
            modulesContainer.style.filter = "blur(0px)";
            globalControlsModuleContainer.style.filter = "blur(0px)";
        } else {
            overlayContainer.style.display = "block";
            modulesContainer.style.filter = "blur(5px)";
            globalControlsModuleContainer.style.filter = "blur(5px)";
        }
    }

    switchDarkMode(value) {
        this.isDarkMode = value;
            if(!this.isDarkMode){
                document.documentElement.setAttribute('theme', 'light');
                this.darkModeButton.innerHTML = "☾";
            } else {
                document.documentElement.setAttribute('theme', 'dark');
                this.darkModeButton.innerHTML = "☀";
            }
    }

    switchFullScreen(fullscreenButton) {
        if (document.fullscreenElement) {
            fullscreenButton.innerHTML = "◱";
            document.exitFullscreen()
        } else {
            fullscreenButton.innerHTML = "◳";
            document.body.requestFullscreen();
        }
    }

    mapMidi(mainModule, midiMapButton) {
        mainModule.mapMidi(midiMapButton);
    }

    saveSession(mainModule) {
        this.connector.saveSession([this.getPersistentState(),
            mainModule.getPersistentState()]);
    }

    loadSession(mainModule) {
        let input = document.createElement('input');
        input.type = 'file';
        input.addEventListener("change", function() {
            let reader = new FileReader();
            reader.addEventListener("load", function() {
                let previouspersistentState = [this.getPersistentState(),
                    mainModule.getPersistentState()];
                let persistentState = JSON.parse(reader.result);
                try {
                    this.setPersistentState(persistentState[0]);
                    mainModule.setPersistentState(persistentState[1]);
                } catch(err) {
                    this.setPersistentState(previouspersistentState[0]);
                    mainModule.setPersistentState(previouspersistentState[1]);
                    alert("Something went wrong while loading the file!");
                }
            }.bind(this));
            reader.readAsText(input.files[0]);
        }.bind(this));
        input.click();
    }


    getPersistentState() {
        return [this.isDarkMode, this.barPosition];
    }

    setPersistentState(persistentState) {
        this.barPosition = persistentState[1];
        this.darkmode = persistentState[0];
        this.updateUI();
    }

    updateUI() {
        this.switchBarPosition(this.barPosition);
        this.switchDarkMode(this.darkmode);
    }

    createUIElements(mainModule) {
        const globalControlsModuleContainer = document.createElement("div");
        globalControlsModuleContainer.id = "globalControlsModuleContainer";
        globalControlsModuleContainer.className =
            this.barPositions[this.barPosition];

        const helpButton = document.createElement("button");
        helpButton.className = "globalControlsButton";
        helpButton.innerHTML = "?";
        helpButton.title = "Welcome to MMAI! Click here for help :)";

        const fullscreenButton = document.createElement("button");
        fullscreenButton.className = "globalControlsButton";
        fullscreenButton.innerHTML = "◱";
        fullscreenButton.title = "Toggle Fullscreen on/off";

        this.positionButton = document.createElement("button");
        this.positionButton.className = "globalControlsButton";
        this.positionButton.innerHTML = "◧";
        this.positionButton.title = "Move control button bar to top/right/left";

        const midiMapButton = document.createElement("button");
        midiMapButton.className = "globalControlsButton inactive";
        midiMapButton.innerHTML = "⚇";
        midiMapButton.title = "Map controls to MIDI. Click on the desired " +
            " button and play the MIDI note to map. " +
            "Double Click on mapped button to delete.";

        this.darkModeButton = document.createElement("button");
        this.darkModeButton.className = "globalControlsButton";
        this.darkModeButton.innerHTML = "☾";
        this.darkModeButton.title = "Switch to Dark/Light Mode";

        const saveButton = document.createElement("button");
        saveButton.className = "globalControlsButton";
        saveButton.innerHTML = "⍗";
        saveButton.style.textDecoration = "udnerline";
        saveButton.title = "Save session";

        const loadButton = document.createElement("button");
        loadButton.className = "globalControlsButton";
        loadButton.innerHTML = "⍐";
        loadButton.style.textDecoration = "udnerline";
        loadButton.title = "Load session";

        let overlayContainer = document.createElement("div");
        overlayContainer.id = "overlayContainer";

        let helpContainer = document.createElement("div");
        helpContainer.id = "helpContainer";
        helpContainer.className = "container";

        let helpTitleDiv = document.createElement("div");
        helpTitleDiv.id = "helpTitleDiv";
        helpTitleDiv.innerHTML = "MMAI";

        let helpTextDiv = document.createElement("div");
        helpTextDiv.id = "helpTextDiv";
        helpTextDiv.innerHTML = "Generate your own melodies in sync with " +
            "click with as many Generators as your system can handle and " +
            "send them each to any of your systems MIDI Ports so you can " +
            "listen to your own AI band!<br/><br/>Hover over any UI Element " +
            "to see the tooltip.<br/><br/>This is the project MMAI by Jakob " +
            "Sudau for his Master Sound/Vision at the HAW Hamburg." +
            "<br/><br/><br/>Enjoy!";

        let helpBottomTextDiv = document.createElement("div");
        helpBottomTextDiv.id = "helpBottomTextDiv";
        helpBottomTextDiv.innerHTML = "Copyright © Jakob Sudau, 2019, " +
            "jakob.sudau@icloud.com";

        let helpDeleteButton = document.createElement("button");
        helpDeleteButton.id = "helpDeleteButton";
        helpDeleteButton.className = "deleteButton";
        helpDeleteButton.innerHTML = "X";
        helpDeleteButton.title = "Close the Help Screen";

        globalControlsModuleContainer.appendChild(helpButton);
        globalControlsModuleContainer.appendChild(this.darkModeButton);
        globalControlsModuleContainer.appendChild(fullscreenButton);
        globalControlsModuleContainer.appendChild(midiMapButton);
        globalControlsModuleContainer.appendChild(this.positionButton);
        globalControlsModuleContainer.appendChild(saveButton);
        globalControlsModuleContainer.appendChild(loadButton);
        helpContainer.appendChild(helpTitleDiv);
        helpContainer.appendChild(helpTextDiv);
        helpContainer.appendChild(helpBottomTextDiv);
        helpContainer.appendChild(helpDeleteButton);
        overlayContainer.appendChild(helpContainer);
        document.body.appendChild(overlayContainer);
        const mainCon = document.getElementById("mainContainer");
        mainCon.insertBefore(globalControlsModuleContainer,
            mainCon.childNodes[0]);

        saveButton.addEventListener('click', function() {
            this.saveSession(mainModule)}.bind(this));

        loadButton.addEventListener('click', function() {
            this.loadSession(mainModule)}.bind(this));

        helpDeleteButton.addEventListener('click', function() {
            this.showHelp()}.bind(this));

        this.positionButton.addEventListener("click", function() {
            this.barPosition < 3 ? this.barPosition++ : this.barPosition = 0;
            this.switchBarPosition(this.barPosition);
        }.bind(this));

        midiMapButton.addEventListener("click", function() {
            this.mapMidi(mainModule, midiMapButton);
        }.bind(this));

        helpButton.addEventListener('click', function() {
            this.showHelp()}.bind(this));

            this.darkModeButton.addEventListener("click", function() {
            this.switchDarkMode(!this.isDarkMode);}.bind(this));

        fullscreenButton.addEventListener("click", function() {
            this.switchFullScreen(fullscreenButton);
        }.bind(this));
    }
}
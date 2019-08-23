// -------------------------------------------------------------------------
// GlobalControls
// -------------------------------------------------------------------------
class GlobalControlsModule {
    constructor(mainModule) {
        if (!!GlobalControlsModule.instance) {
            return GlobalControlsModule.instance;
        }

        document.documentElement.setAttribute('theme', 'light');
        GlobalControlsModule.instance = this;
        this.isDarkMode = false;
        this.createUIElements(mainModule);

        this.connector = new Connector(this);
        this.connector.initialize(0);
    }

    switchBarPosition() {
        const mainSubCon = document.getElementById("modulesContainer");
        const mainCon = document.getElementById("mainContainer");
        switch (globalControlsModuleContainer.className) {
            case "left":
                positionButton.innerHTML = "⬒";
                globalControlsModuleContainer.className = "top";
                mainSubCon.className = "modulesContainerTopBottom";
                break;
            case "top":
                positionButton.innerHTML = "◨";
                globalControlsModuleContainer.className = "right";
                mainSubCon.className = "modulesContainerLeftRight";
                break;
            case "right":
                positionButton.innerHTML = "⬓";
                globalControlsModuleContainer.className = "bottom";
                mainSubCon.className = "modulesContainerTopBottom";
                mainCon.appendChild(globalControlsModuleContainer);
                break;
            case "bottom":
                positionButton.innerHTML = "◧";
                globalControlsModuleContainer.className = "left";
                mainSubCon.className = "modulesContainerLeftRight";
                mainCon.insertBefore(globalControlsModuleContainer,mainCon.childNodes[0]);
                break;
        }
    }

    showHelp() {
        const modulesContainer = document.getElementById("modulesContainer");
        const globalControlsModuleContainer = document.getElementById("globalControlsModuleContainer");
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
                darkModeButton.innerHTML = "☾";
            } else {
                document.documentElement.setAttribute('theme', 'dark');
                darkModeButton.innerHTML = "☀";
            }
    }

    switchFullScreen() {
        if (document.fullscreenElement) {
            fullscreenButton.innerHTML = "◱";
            document.exitFullscreen()
        } else {
            fullscreenButton.innerHTML = "◳";
            document.body.requestFullscreen();
        }
    }

    mapMidi(mainModule) {
        mainModule.mapMidi();
    }

    createUIElements(mainModule) {
        const globalControlsModuleContainer = document.createElement("div");
        globalControlsModuleContainer.id = "globalControlsModuleContainer";
        globalControlsModuleContainer.className = "left";

        const helpButton = document.createElement("button");
        helpButton.id = "helpButton";
        helpButton.innerHTML = "?";
        helpButton.title = "Welcome to MMAI! Click here for help :)";

        const fullscreenButton = document.createElement("button");
        fullscreenButton.id = "fullscreenButton";
        fullscreenButton.innerHTML = "◱";
        fullscreenButton.title = "Toggle Fullscreen on/off";

        const positionButton = document.createElement("button");
        positionButton.id = "positionButton";
        positionButton.innerHTML = "◧";
        positionButton.title = "Move control button bar to top/right/left";

        const midiMapButton = document.createElement("button");
        midiMapButton.id = "midiMapButton";
        midiMapButton.className = "midiMapButton inactive";
        midiMapButton.innerHTML = "⚇";
        midiMapButton.title = "Map controls to MIDI. Click on the desired " +
            " button and play the MIDI note to map. " +
            "Double Click on mapped button to delete.";

        const darkModeButton = document.createElement("button");
        darkModeButton.id = "darkModeButton";
        darkModeButton.innerHTML = "☾";
        darkModeButton.title = "Switch to Dark/Light Mode";

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
        globalControlsModuleContainer.appendChild(darkModeButton);
        globalControlsModuleContainer.appendChild(fullscreenButton);
        globalControlsModuleContainer.appendChild(midiMapButton);
        globalControlsModuleContainer.appendChild(positionButton);
        helpContainer.appendChild(helpTitleDiv);
        helpContainer.appendChild(helpTextDiv);
        helpContainer.appendChild(helpBottomTextDiv);
        helpContainer.appendChild(helpDeleteButton);
        overlayContainer.appendChild(helpContainer);
        document.body.appendChild(overlayContainer);
        const mainCon = document.getElementById("mainContainer");
        mainCon.insertBefore(globalControlsModuleContainer, mainCon.childNodes[0]);

        helpDeleteButton.addEventListener('click', function() {
            this.showHelp()}.bind(this));

        positionButton.addEventListener("click", function() {
            this.switchBarPosition()}.bind(this));

        midiMapButton.addEventListener("click", function() {
            this.mapMidi(mainModule);
        }.bind(this));

        helpButton.addEventListener('click', function() {
            this.showHelp()}.bind(this));

        darkModeButton.addEventListener("click", function() {
            this.switchDarkMode(!this.isDarkMode);}.bind(this));

        fullscreenButton.addEventListener("click", function() {
            this.switchFullScreen();
        }.bind(this));
    }
}
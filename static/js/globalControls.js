// -------------------------------------------------------------------------
// GlobalControls
// -------------------------------------------------------------------------
class GlobalControlModule {
    constructor() {
        document.documentElement.setAttribute('theme', 'light');
        this.isDarkMode = false;
        this.createUIElements();
    }

    switchBarPosition() {
        const mainSubCon = document.getElementById("modulesContainer");
        const mainCon = document.getElementById("mainContainer");
        switch (globalControlsContainer.className) {
            case "left":
                positionButton.innerHTML = "⬒";
                globalControlsContainer.className = "top";
                mainSubCon.className = "modulesContainerTopBottom";
                break;
            case "top":
                positionButton.innerHTML = "◨";
                globalControlsContainer.className = "right";
                mainSubCon.className = "modulesContainerLeftRight";
                break;
            case "right":
                positionButton.innerHTML = "⬓";
                globalControlsContainer.className = "bottom";
                mainSubCon.className = "modulesContainerTopBottom";
                mainCon.appendChild(globalControlsContainer);
                break;
            case "bottom":
                positionButton.innerHTML = "◧";
                globalControlsContainer.className = "left";
                mainSubCon.className = "modulesContainerLeftRight";
                mainCon.insertBefore(globalControlsContainer,mainCon.childNodes[0]);
                break;
        }
    }

    showHelp() {
        const modulesContainer = document.getElementById("modulesContainer");
        const globalControlsContainer = document.getElementById("globalControlsContainer");
        const overlay = document.getElementById("overlay");
        if (overlay.style.display == "block") {
            overlay.style.display = "none";
            modulesContainer.style.filter = "blur(0px)";
            globalControlsContainer.style.filter = "blur(0px)";
        } else {
            overlay.style.display = "block";
            modulesContainer.style.filter = "blur(5px)";
            globalControlsContainer.style.filter = "blur(5px)";
        }
    }

    createUIElements() {
        const globalControlsContainer = document.createElement("div");
        globalControlsContainer.id = "globalControlsContainer";
        globalControlsContainer.className = "left";

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

        let overlay = document.createElement("div");
        overlay.id = "overlay";

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

        globalControlsContainer.appendChild(helpButton);
        globalControlsContainer.appendChild(darkModeButton);
        globalControlsContainer.appendChild(fullscreenButton);
        globalControlsContainer.appendChild(midiMapButton);
        globalControlsContainer.appendChild(positionButton);
        helpContainer.appendChild(helpTitleDiv);
        helpContainer.appendChild(helpTextDiv);
        helpContainer.appendChild(helpBottomTextDiv);
        helpContainer.appendChild(helpDeleteButton);
        overlay.appendChild(helpContainer);
        document.body.appendChild(overlay);
        const mainCon = document.getElementById("mainContainer");
        mainCon.insertBefore(globalControlsContainer, mainCon.childNodes[0]);

        helpDeleteButton.addEventListener('click', function() {
            this.showHelp()}.bind(this));

        positionButton.addEventListener("click", function() {
            this.switchBarPosition()}.bind(this));

        midiMapButton.addEventListener("click", function() {
            mainModule.mapMidi();
        });

        helpButton.addEventListener('click', function() {
            this.showHelp()}.bind(this));

        darkModeButton.addEventListener("click", function() {
            this.isDarkMode = !this.isDarkMode;
            if(!this.isDarkMode){
                document.documentElement.setAttribute('theme', 'light');
                darkModeButton.innerHTML = "☾";
            } else {
                document.documentElement.setAttribute('theme', 'dark');
                darkModeButton.innerHTML = "☀";
            }
        }.bind(this));

        fullscreenButton.addEventListener("click", function() {
            globalControlsContainer
            if (document.fullscreenElement) {
                fullscreenButton.innerHTML = "◱";
                document.exitFullscreen()
            } else {
                fullscreenButton.innerHTML = "◳";
                document.body.requestFullscreen();
            }
        });
    }
}
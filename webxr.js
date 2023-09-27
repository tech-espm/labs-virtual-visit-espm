let canvas = document.getElementById("renderCanvas");
let engine = null;
let dome = null;
let ui = null;
let uiOpenButton = null;
let panelButtons = [];
let scene = null;
let camera = null;
let xrHelper = null;
let photoIndex = 0;
let visibleUI = true; // Stopping user input on invisible buttons
let changingImage = false; // Stopping user input during image transition
let currRenderMode = "reveal-image" // "show", "change-image", "reveal-image", "reveal-ui", "hide-ui"
const MAX_PHOTO_INDEX = 3;
const FRAME_FADE_PERCENT = 0.01;

let imagesJSON = [
    {
        file: "./textures/photo0.jpg",
        name: "Green hills"
    },
    {
        file: "./textures/photo1.jpg",
        name: "Another universe"
    },
    {
        file: "./textures/photo2.jpg",
        name: "Manson"
    },
    {
        file: "./textures/photo3.jpg",
        name: "Snow hills"
    }
]

function imageFromMenu(index) {
    return imagesJSON[index]
}

function setPanelButtonsVisibility(visibility) {
    for (let i = 0; i < panelButtons.length; i++) {
        console.log(panelButtons[i])
        panelButtons[i].isVisible = visibility;
    }

    visibleUI = visibility
    console.log({visibleUI, panelButtons})
}

let renderTypes = {
    "show": () => {
        // console.log("Showing curr image")
    },
    "change-image": () => {
        console.log("Changing Image")
        changingImage = true

        // setPanelButtonsVisibility(false)

        dome.material.alpha = Math.max(0, dome.material.alpha - FRAME_FADE_PERCENT)
        if (dome.material.alpha > 0) {
            return
        }

        replaceDome(scene)

        replaceUI()

        changingImage = false
        currRenderMode = "reveal-image"
    },
    "reveal-image": () => {
        console.log("Revealing Image")
        dome.material.alpha = Math.min(1, dome.material.alpha + FRAME_FADE_PERCENT)
        if (dome.material.alpha < 1) {
            return
        }

        currRenderMode = "show"
    },
    "reveal-ui": () => {
        console.log("Revealing UI")
        setPanelButtonsVisibility(true)
        currRenderMode = "show"
    },
    "hide-ui": () => {
        console.log("Hiding UI")
        setPanelButtonsVisibility(false)
        currRenderMode = "show"
    }
}

function replaceDome(scene) {
    if (dome) {
        dome.dispose();
        dome = null;
    }

    dome = new BABYLON.PhotoDome(
        "dome",
        imageFromMenu(photoIndex).file,
        {
            resolution: 32,
            size: 1000
        },
        scene
    );

    dome.material.alpha = 0
}

function replaceUI() {
    if (ui) {
        ui.dispose()
        ui = null
    }

    ui = new BABYLON.GUI.GUI3DManager(scene);

    attachPanel()
}

function attachPanel() {
    let anchor = new BABYLON.TransformNode("panel-anchor");
    panel = new BABYLON.GUI.PlanePanel();
    panel.linkToTransformNode(anchor);
    panel.position.z = -1.5;

    ui.addControl(panel)

    for (let i = 0; i < imagesJSON.length; i++) {
        if (photoIndex != i) {
            const image = imagesJSON[i];

            let button = createChangeImageButton(image, i)

            panelButtons.push(button)

            panel.addControl(button)
        }
    }

    let menuButton = createMenuButton()
    ui.addControl(menuButton);
    uiOpenButton = menuButton

    let browserModeButton = createBrowserModeButton()
    panel.addControl(browserModeButton)
    panelButtons.push(browserModeButton)
}

function uiSwitch() {
    if (visibleUI) {
        currRenderMode = "hide-ui"
    } else {
        currRenderMode = "reveal-ui"
    }
}

function createMenuButton() {
    return createHolographicButton("open-overlay", "Alternar menu", true, uiSwitch)
}

function createChangeImageButton(image, index) {
    return createHolographicButton("button-" + index, image.name, false, function () {
        photoIndex = index
        if (visibleUI) {
            console.log(`${image.name} PRESSED!`)
            currRenderMode = "change-image"
        }
    })
}

function createBrowserModeButton() {
    return createHolographicButton("browser-mode", "Modo Navegador", false, function () {
        window.location.href = "./index.html"
    })
}

function createHolographicButton(name, text, visibility, event) {
    let button = new BABYLON.GUI.HolographicButton(name);
    button.text = text
    // button.isVisible = visibility

    button.onPointerUpObservable.add(event);
    // button.onPointerClickObservable.add(event);

    return button
}

let controlMap = {
    "a": () => {
        photoIndex--
        currRenderMode = "change-image"

        if (photoIndex < 0) {
            photoIndex = MAX_PHOTO_INDEX
        }
    },
    "d": () => {
        photoIndex++
        currRenderMode = "change-image"

        if (photoIndex > MAX_PHOTO_INDEX) {
            photoIndex = 0
        }
    },
    "m": uiSwitch
}


async function createScene() {
    // This creates a basic Babylon Scene object (non-mesh)
    scene = new BABYLON.Scene(engine);

    scene.debugLayer.show({ embedMode: true });

    camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 2, Math.PI / 2, 5, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.inputs.attached.mousewheel.detachControl(canvas);

    replaceDome(scene)

    // FOV
    dome.fovMultiplier = 2 // Vai de 0.0 a 2.0

    scene.onKeyboardObservable.add((kbInfo) => {
        if (changingImage) {
            return
        }

        if (kbInfo.type !== BABYLON.KeyboardEventTypes.KEYDOWN) {
            return
        }

        let key = kbInfo.event.key
        if (Object.keys(controlMap).includes(key)) {
            let controlFunciton = controlMap[key]
            controlFunciton()
        } else {
            console.log("UNKOWN COMMAND")
        }
    });

    xrHelper = await scene.createDefaultXRExperienceAsync()

    replaceUI()
}

// Resize
window.addEventListener("resize", function () {
    if (engine)
        engine.resize();
});

async function initFunction() {
    engine = new BABYLON.Engine(canvas, true, {
        preserveDrawingBuffer: false,
        stencil: false,
        disableWebGL2Support: false
    });

    await createScene();

    engine.runRenderLoop(function () {
        if (scene && scene.activeCamera) {
            renderTypes[currRenderMode]()
            scene.render();
        }
    });
}

initFunction();

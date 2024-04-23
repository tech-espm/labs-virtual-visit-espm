let canvas = document.getElementById("renderCanvas");
let engine = null;
let dome = null;
let ui = null;
let scene = null;
let photoIndex = 0;
let visibleUI = false; // Stopping user input on invisible buttons
let changingImage = false; // Stopping user input during image transition
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

let currRenderMode = "reveal-image" // "show", "change-image", "reveal-image", "reveal-ui", "hide-ui"
let renderTypes = {
    "show": () => {
    },
    "change-image": () => {
        changingImage = true

        ui.getControlByName("menu").alpha = Math.max(0, ui.getControlByName("menu").alpha - FRAME_FADE_PERCENT)
        if (ui.getControlByName("menu").alpha > 0) {
            return
        }

        visibleUI = false

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
        dome.material.alpha = Math.min(1, dome.material.alpha + FRAME_FADE_PERCENT)
        if (dome.material.alpha < 1) {
            return
        }

        currRenderMode = "show"
    },
    "reveal-ui": () => {
        ui.getControlByName("menu").alpha = Math.min(1, ui.getControlByName("menu").alpha + FRAME_FADE_PERCENT)
        if (ui.getControlByName("menu").alpha < 1) {
            return
        }

        visibleUI = true
        currRenderMode = "show"
    },
    "hide-ui": () => {
        ui.getControlByName("menu").alpha = Math.max(0, ui.getControlByName("menu").alpha - FRAME_FADE_PERCENT)
        if (ui.getControlByName("menu").alpha > 0) {
            return
        }

        visibleUI = false
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

    ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    attachPanel()

    attachMenu()
}

function attachPanel() {
    var panel = new BABYLON.GUI.StackPanel("menu");

    panel.alpha = 0

    for (let i = 0; i < imagesJSON.length; i++) {
        if (photoIndex != i) {
            const image = imagesJSON[i];

            let button = createChangeImageButton(image, i)

            panel.addControl(button, 0, i)
        }
    }

    let webxrButton = createWebXRButton()

    panel.addControl(webxrButton)

    ui.addControl(panel)
}

function createWebXRButton() {
    return createButton("webxr-mode", "Modo WebXR", function () {
        window.location.href = "./webxr.html"
    })
}

function attachMenu() {
    button = createMenuButton()

    ui.addControl(button);
}

function createMenuButton() {
    let button = createButton("open-overlay", "Alternar menu", uiSwitch)

    button.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    button.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP

    return button
}

function uiSwitch() {
    if (visibleUI) {
        currRenderMode = "hide-ui"
    } else {
        currRenderMode = "reveal-ui"
    }
}

function createChangeImageButton(image, index) {
    return createButton("button-" + index, image.name, function () {
        photoIndex = index
        if (visibleUI) {
            currRenderMode = "change-image"
        }
    })
}

function createButton(name, text, event) {
    let button = BABYLON.GUI.Button.CreateSimpleButton(name, text);
    button.paddingBottom = '30px'
    button.width = "160px"
    button.height = "80px"
    button.color = 'black'
    button.background = 'white'

    button.onPointerUpObservable.add(event);

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

function imageFromMenu(index) {
    return imagesJSON[index]
}

async function createScene() {
    // This creates a basic Babylon Scene object (non-mesh)
    scene = new BABYLON.Scene(engine);

	// Debug / Inspector
	if (window.debug)
    	scene.debugLayer.show({ embedMode: true });

    let camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 2, Math.PI / 2, 5, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.inputs.attached.mousewheel.detachControl(canvas);

    replaceDome(scene)

    // FOV
    dome.fovMultiplier = 2 // Vai de 0.0 a 2.0

    replaceUI()

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
        }
    });
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
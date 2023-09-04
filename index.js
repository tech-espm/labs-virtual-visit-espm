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
        // console.log("Showing curr image")
    },
    "change-image": () => {
        console.log("Changing Image")
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
        console.log("Revealing Image")
        dome.material.alpha = Math.min(1, dome.material.alpha + FRAME_FADE_PERCENT)
        if (dome.material.alpha < 1) {
            return
        }

        currRenderMode = "show"
    },
    "reveal-ui": () => {
        console.log("Revealing UI")
        ui.getControlByName("menu").alpha = Math.min(1, ui.getControlByName("menu").alpha + FRAME_FADE_PERCENT)
        if (ui.getControlByName("menu").alpha < 1) {
            return
        }

        visibleUI = true
        currRenderMode = "show"
    },
    "hide-ui": () => {
        console.log("Hiding UI")
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
}

function attachPanel() {
    var panel = new BABYLON.GUI.StackPanel("menu");

    panel.alpha = 0

    for (let i = 0; i < imagesJSON.length; i++) {
        if (photoIndex != i) {
            const image = imagesJSON[i];

            let button = createButton(image, i)

            panel.addControl(button, 0, i)
        }
    }

    ui.addControl(panel)
}

function createButton(image, index) {
    let button = BABYLON.GUI.Button.CreateSimpleButton("button-" + index, image.name);
    button.paddingBottom = '30px'
    button.width = "160px"
    button.height = "80px"
    button.color = 'black'
    button.background = 'white'

    button.onPointerUpObservable.add(function () {
        photoIndex = index
        if (visibleUI) {
            console.log(`${image.name} PRESSED!`)
            currRenderMode = "change-image"
        }
    });

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
    "m": () => {
        if (visibleUI) {
            currRenderMode = "hide-ui"
        } else {
            currRenderMode = "reveal-ui"
        }
    }
}

function imageFromMenu(index) {
    return imagesJSON[index]
}

async function createScene() {
    // This creates a basic Babylon Scene object (non-mesh)
    scene = new BABYLON.Scene(engine);

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
        } else {
            console.log("UNKOWN COMMAND")
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

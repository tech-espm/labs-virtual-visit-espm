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
const ESPM_DARK = new BABYLON.Color3(0.658, 0.197, 0.196)
const ESPM_LIGHT = new BABYLON.Color3(0.448, 0.117, 0.134)


let imagesJSON = [
    {
        file: "./textures/photo0.jpg",
        name: "Green\nhills"
    },
    {
        file: "./textures/photo1.jpg",
        name: "Another\nuniverse"
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
        panelButtons[i].isVisible = visibility;
    }

    visibleUI = visibility
}

let renderTypes = {
    "show": () => {
    },
    "change-image": () => {
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
        dome.material.alpha = Math.min(1, dome.material.alpha + FRAME_FADE_PERCENT)
        if (dome.material.alpha < 1) {
            return
        }

        currRenderMode = "show"
    },
    "reveal-ui": () => {
        setPanelButtonsVisibility(true)
        currRenderMode = "show"
    },
    "hide-ui": () => {
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
    panel.columns = 3
    panel.rows = 2

    ui.addControl(panel)

    // Cores ESPM
    // #a80532
    // #720322

    for (let i = 0; i < imagesJSON.length; i++) {
        if (photoIndex != i) {
            const image = imagesJSON[i];

            for (let j = 0; j < 3; j++) {

                let button = createChangeImageButton(image, i)
                panelButtons.push(button)

                panel.addControl(button)

                // https://doc.babylonjs.com/features/featuresDeepDive/gui/gui3D#holographicbutton
                overwriteButtonContent(button, image.name)
            }
        }
    }

    let menuButton = createMenuButton()
    panel.addControl(menuButton);
    overwriteButtonContent(menuButton, "Alternar menu")
    uiOpenButton = menuButton

    // let browserModeButton = createBrowserModeButton()
    // panel.addControl(browserModeButton)
    // panelButtons.push(browserModeButton)
}

function uiSwitch() {
    if (visibleUI) {
        currRenderMode = "hide-ui"
    } else {
        currRenderMode = "reveal-ui"
    }
}

function overwriteButtonContent(button, text) {
    let content = new BABYLON.GUI.TextBlock();
    content.text = text;
    content.color = "White";
    content.fontSize = 36;
    button.content = content
    button.scaling = button.scaling.scale(1.8)
    button.frontMaterial = new BABYLON.GUI.FluentButtonMaterial("espm", scene);
    button.frontMaterial.alphaMode = BABYLON.Engine.ALPHA_ONEONE;
    button.frontMaterial.albedoColor = ESPM_LIGHT;
    button.backMaterial.albedoColor = ESPM_DARK;
}

function createMenuButton() {
    return createHolographicButton("open-overlay", uiSwitch)
}

function createChangeImageButton(image, index) {
    return createHolographicButton("button-" + index, function () {
        photoIndex = index
        if (visibleUI) {
            console.log(`${image.name} PRESSED!`)
            currRenderMode = "change-image"
        }
    })
}

// function createBrowserModeButton() {
//     return createHolographicButton("browser-mode", function () {
//         window.location.href = "./index.html"
//     })
// }

function createHolographicButton(name, event) {
    let button = new BABYLON.GUI.HolographicButton(name);
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

	// Debug / Inspector
	if (window.debug)
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

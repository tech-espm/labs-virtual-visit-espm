let canvas = document.getElementById("renderCanvas");
let engine = null;
let dome = null;
let ui = null;
let scene = null;
let photoIndex = 0;
let fadeIn = false;
let fadeOut = false;
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

let controlMap = {
    "a": () => {
        photoIndex--
        fadeDome("out")

        if (photoIndex < 0) {
            photoIndex = MAX_PHOTO_INDEX
        }
    },
    "d": () => {
        photoIndex++
        fadeDome("out")

        if (photoIndex > MAX_PHOTO_INDEX) {
            photoIndex = 0
        }
    }
}

function imageFromMenu(index) {
    return imagesJSON[index]
}

function fadeDome(direction) { // "in", "out" or "reset"
    fadeIn = direction === "in"
    fadeOut = direction === "out"
}

async function createScene() {
    // This creates a basic Babylon Scene object (non-mesh)
    scene = new BABYLON.Scene(engine);

    scene.debugLayer.show({ embedMode: true });

    let camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 2, Math.PI / 2, 5, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.inputs.attached.mousewheel.detachControl(canvas);

    dome = replaceDome(scene)

    replaceUI()

    // FOV
    dome.fovMultiplier = 2 // Vai de 0.0 a 2.0

    scene.onKeyboardObservable.add((kbInfo) => {
        let key = kbInfo.event.key
        if (Object.keys(controlMap).includes(key)) {
            let controlFunciton = controlMap[key]
            controlFunciton()
        } else {
            console.log("UNKOWN COMMAND")
        }
    });
}

function replaceDome(scene) {
    if (dome) {
        dome.dispose();
        dome = null;
    }

    replaceUI()

    return new BABYLON.PhotoDome(
        "dome",
        imageFromMenu(photoIndex).file,
        {
            resolution: 32,
            size: 1000
        },
        scene
    );
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
    var panel = new BABYLON.GUI.StackPanel();

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
        console.log(`${image.name} PRESSED!`)
        photoIndex = index
        fadeDome("out")
    });

    return button
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
            if (fadeOut) {
                dome.material.alpha = Math.max(0, dome.material.alpha - FRAME_FADE_PERCENT);
                if (dome.material.alpha <= 0) {
                    // fade out acabou! Fazer algo!
                    dome = replaceDome(scene);
                    dome.material.alpha = 0

                    fadeDome("in")
                }
            } else if (fadeIn) {
                dome.material.alpha = Math.min(1, dome.material.alpha + FRAME_FADE_PERCENT);
                if (dome.material.alpha >= 1) {
                    // fade in acabou! Fazer algo!
                    fadeDome("reset")
                }
            }
            scene.render();
        }
    });
}

initFunction();

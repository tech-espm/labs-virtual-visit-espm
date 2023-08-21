let canvas = document.getElementById("renderCanvas");
let engine = null;
let dome = null;
let scene = null;
let photoIndex = 0;
let fadeIn = false;
let fadeOut = false;
const MAX_PHOTO_INDEX = 3;
const FRAME_FADE_PERCENT = 0.01;

async function createScene() {
    // This creates a basic Babylon Scene object (non-mesh)
    scene = new BABYLON.Scene(engine);

    scene.debugLayer.show({ embedMode: true });

    let camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 2, Math.PI / 2, 5, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.inputs.attached.mousewheel.detachControl(canvas);

    dome = new BABYLON.PhotoDome(
        "testdome",
        "./textures/photo0.jpg",
        {
            resolution: 32,
            size: 1000
        },
        scene
    );

    // FOV
    dome.fovMultiplier = 2 // Vai de 0.0 a 2.0

    window.addEventListener("keydown", function (e) {
        switch (e.key) {
            case "a":
                photoIndex--
                fadeOut = true
                fadeIn = false

                if (photoIndex < 0) {
                    photoIndex = MAX_PHOTO_INDEX
                }

                break;

            case "d":
                photoIndex++
                fadeOut = true
                fadeIn = false

                if (photoIndex > MAX_PHOTO_INDEX) {
                    photoIndex = 0
                }
                break;

            default:
                console.log("UNKOWN COMMAND")
                break;
        }
    });
}

function replaceDome(scene) {
    if (dome) {
        dome.dispose();
        dome = null;
    }

    return new BABYLON.PhotoDome(
        "testdome",
        `./textures/photo${photoIndex}.jpg`,
        {
            resolution: 32,
            size: 1000
        },
        scene
    );
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

                    fadeOut = false
                    fadeIn = true
                }
            } else if (fadeIn) {
                dome.material.alpha = Math.min(1, dome.material.alpha + FRAME_FADE_PERCENT);
                if (dome.material.alpha >= 1) {
                    // fade in acabou! Fazer algo!
                }
            }
            scene.render();
        }
    });
}

initFunction();

let canvas = document.getElementById("renderCanvas");
let engine = null;
let dome = null;
let scene = null;
let photoIndex = 0;

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

                if (photoIndex < 0) {
                    photoIndex = 3
                }
                break;

            case "d":
                photoIndex++

                if (photoIndex > 3) {
                    photoIndex = 0
                }
                break;

            default:
                console.log("UNKOWN COMMAND")
                break;
        }

        if (dome) {
            dome.dispose();
            dome = null;
        }

        dome = new BABYLON.PhotoDome(
            "testdome",
            `./textures/photo${photoIndex}.jpg`,
            {
                resolution: 32,
                size: 1000
            },
            scene
        );
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
        if (scene && scene.activeCamera)
            scene.render();
    });
}

initFunction();

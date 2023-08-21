var canvas = document.getElementById("renderCanvas");

        var startRenderLoop = function (engine, canvas) {
            engine.runRenderLoop(function () {
                if (sceneToRender && sceneToRender.activeCamera) {
                    sceneToRender.render();
                }
            });
        }

        var engine = null;
        var scene = null;
        var sceneToRender = null;
        var createDefaultEngine = function () { return new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, disableWebGL2Support: false }); };
        var createScene = function () {
            // This creates a basic Babylon Scene object (non-mesh)
            var scene = new BABYLON.Scene(engine)

            var camera = new BABYLON.ArcRotateCamera("camera", BABYLON.Tools.ToRadians(90), BABYLON.Tools.ToRadians(65), 10, BABYLON.Vector3.Zero(), scene);

            // This attaches the camera to the canvas
            camera.attachControl(canvas, true);

            // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
            var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

            // Default intensity is 1. Let's dim the light a small amount
            light.intensity = 0.7;

            // Our built-in 'ground' shape.
            var ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);

            var groundMaterial = new BABYLON.StandardMaterial("Ground Material", scene)

            var groundTexture = new BABYLON.Texture(Assets.textures.checkerboard_basecolor_png.rootUrl, scene)

            groundMaterial.diffuseTexture = groundTexture;
            groundMaterial.diffuseColor = BABYLON.Color3.Red()
            ground.material = groundMaterial;

            BABYLON.SceneLoader.ImportMesh("", Assets.meshes.Yeti.rootUrl, Assets.meshes.Yeti.filename, scene, function (newMeshes) {
                newMeshes[0].scaling = new BABYLON.Vector3(0.1, 0.1, 0.1)
            });

            return scene;
        };
        window.initFunction = async function () {



            var asyncEngineCreation = async function () {
                try {
                    return createDefaultEngine();
                } catch (e) {
                    console.log("the available createEngine function failed. Creating the default engine instead");
                    return createDefaultEngine();
                }
            }

            window.engine = await asyncEngineCreation();
            if (!engine) throw 'engine should not be null.';
            startRenderLoop(engine, canvas);
            window.scene = createScene();
        };
        initFunction().then(() => {
            sceneToRender = scene
        });

        // Resize
        window.addEventListener("resize", function () {
            engine.resize();
        });
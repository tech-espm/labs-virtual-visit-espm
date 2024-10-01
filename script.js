"use strict";

const modoXR = (window.location.href.indexOf("webxr") >= 0);

const imagens = [
	{
		url: "./textures/recepcao-jt.jpg",
		nome: "Recepção (JT)"
	},
	{
		url: "./textures/biblioteca-jt.jpg",
		nome: "Biblioteca (JT)"
	},
	{
		url: "./textures/coworking-jt.jpg",
		nome: "Coworking (JT)"
	},
	{
		url: "./textures/base-jt.jpg",
		nome: "BASE (JT)"
	},
	{
		url: "./textures/area-externa-jt.jpg",
		nome: "Área Externa (JT)"
	},
	{
		url: "./textures/3-andar-jt.jpg",
		nome: "3º andar (JT)"
	},
	{
		url: "./textures/sala-aula-6-andar-jt.jpg",
		nome: "Sala 6º andar (JT)"
	},
	{
		url: "./textures/auditorio-11-3-jt.jpg",
		nome: "Auditório 11º andar (JT)"
	},
	{
		url: "./textures/terraco-jt.jpg",
		nome: "Terraço (JT)"
	},
];

let canvas = document.getElementById("renderCanvas");
let engine = null;
let camera = null;
let domo = null;
let ui = null;
let cena = null;
let imagemAtual = 0;
let menu = null;
let xrHelper = null;
let botoesImagemXR = [];
let botaoLocaisXR = null;

function criarBotao(nome, texto, callback) {
	let botao;
	if (modoXR) {
		// https://doc.babylonjs.com/typedoc/classes/BABYLON.GUI.HolographicButton
		botao = new BABYLON.GUI.HolographicButton(nome);
		menu.addControl(botao);
		botao.text = texto;
	} else {
		botao = BABYLON.GUI.Button.CreateSimpleButton(nome, texto);
		botao.paddingBottom = "30px";
		botao.paddingRight = "30px";
		botao.width = "160px";
		botao.height = "80px";
		botao.color = "black";
		botao.background = "white";
	}
	botao.onPointerDownObservable.add(callback);
	return botao;
}

function criarBotaoImagem(indice) {
	return criarBotao("botaoImagem" + indice, imagens[indice].nome, function () {
		imagemAtual = indice;
		if (!modoXR)
			alternarMenu();
		criarDomo(true);
	});
}

function criarBotoesMenuXR(visibilidadeBotoesImagem) {
	if (menu) {
		if (botoesImagemXR) {
			for (let i = botoesImagemXR.length - 1; i >= 0; i--) {
				botoesImagemXR[i].dispose();
				menu.removeControl(botoesImagemXR[i]);
			}
		}
		if (botaoLocaisXR) {
			botaoLocaisXR.dispose();
			menu.removeControl(botaoLocaisXR);
		}
		botoesImagemXR = [];
		botaoLocaisXR = null;
		ui.removeControl(menu);
		menu.dispose();
		menu = null;
	}

	const ancora = new BABYLON.TransformNode("ancora-menu");
	menu = new BABYLON.GUI.SpherePanel();
	menu.margin = 0.2;
	menu.radius = 5;
	menu.rows = 4;
	ui.addControl(menu);
	menu.linkToTransformNode(ancora);
	menu.position.z = -2; // Move a esfera um pouco para a direita
	menu.position.x = -4; // Move a esfera um pouco para trás
	menu.blockLayout = true;
	botaoLocaisXR = criarBotao("locais", "Locais", alternarMenu);
	for (let i = 0; i < imagens.length; i++) {
		const botao = criarBotaoImagem(i);
		botao.isVisible = visibilidadeBotoesImagem;
		botoesImagemXR.push(botao);
	}
	menu.blockLayout = false;
}

function criarDomo(recriarMenuXR) {
	if (domo) {
		domo.dispose();
		domo = null;
	}

	camera.alpha = Math.PI / 2; // Para criarDomo() funcionar corretamente
	camera.beta = Math.PI / 2;

	domo = new BABYLON.PhotoDome("Domo", imagens[imagemAtual].url, {
		//resolution: 32,
		size: 1000
	}, cena);

	//domo.material.alpha = 0;
	// Vai de 0.0 a 2.0
	domo.fovMultiplier = 2;

	// Faz a câmera apontar para frente
	camera.alpha = Math.PI;

	if (recriarMenuXR && modoXR)
		criarBotoesMenuXR(false);
}

function alternarMenu() {
	if (modoXR) {
		const visibilidadeBotoesImagem = !botoesImagemXR[0].isVisible;
		criarBotoesMenuXR(visibilidadeBotoesImagem);
		return;
	}

	if (menu) {
		camera.inputs.attached.pointers.attachControl(canvas);
		ui.removeControl(menu);
		menu = null;
	} else {
		camera.inputs.attached.pointers.detachControl(canvas);
		// https://doc.babylonjs.com/typedoc/classes/BABYLON.GUI.StackPanel
		menu = new BABYLON.GUI.StackPanel("menu");
		menu.isVertical = true;

		let menuAtual = null;

		for (let i = 0, qtdeAtual = 0; i < imagens.length; i++) {
			if (i != imagemAtual) {
				if (!menuAtual || qtdeAtual >= 4) {
					qtdeAtual = 0;
					menuAtual = new BABYLON.GUI.StackPanel("menuAtual" + i);
					menuAtual.isVertical = false;
					menuAtual.height = "110px";
					menuAtual.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
					menuAtual.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
					menu.addControl(menuAtual);
				}
				qtdeAtual++;
				menuAtual.addControl(criarBotaoImagem(i));
			}
		}

		const botao = criarBotao("botaoWebXR", "Modo WebXR", function () {
			window.location.href = "./webxr.html";
		});
		botao.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
		botao.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
		menu.addControl(botao);

		ui.addControl(menu);
	}
}

async function criarCena() {
	cena = new BABYLON.Scene(engine);

	if (window.debug)
		cena.debugLayer.show({ embedMode: true });

	camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 2, Math.PI / 2, 5, BABYLON.Vector3.Zero(), cena);
	camera.attachControl(canvas, true);
	camera.inputs.attached.mousewheel.detachControl(canvas);

	// https://doc.babylonjs.com/typedoc/classes/BABYLON.ArcRotateCamera
	camera.inertia = 0.75; // Valor padrão = 0.9

	criarDomo(false);

	if (modoXR) {
		xrHelper = await cena.createDefaultXRExperienceAsync();

		// https://doc.babylonjs.com/features/featuresDeepDive/gui/gui3D
		// https://doc.babylonjs.com/typedoc/classes/BABYLON.GUI.SpherePanel
		ui = new BABYLON.GUI.GUI3DManager(cena);
		criarBotoesMenuXR(false);
	} else {
	    ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

		const botao = criarBotao("locais", "Locais", alternarMenu);
		botao.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
		botao.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
		ui.addControl(botao);
	}
}

window.addEventListener("resize", function () {
	if (engine)
		engine.resize();
});

async function setup() {
	engine = new BABYLON.Engine(canvas, true, {
		preserveDrawingBuffer: false,
		stencil: false,
		disableWebGL2Support: false
	});

	await criarCena();

	engine.runRenderLoop(function () {
		if (cena && cena.activeCamera) {
			cena.render();
		}
	});
}

setup();

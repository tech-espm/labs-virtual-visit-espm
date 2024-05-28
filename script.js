"use strict";

const imagens = [
	{
		url: "./textures/recepcao.jpg",
		nome: "Recepção (JT)"
	},
	{
		url: "./textures/biblioteca-jt.jpg",
		nome: "Biblioteca (JT)"
	},
	{
		url: "./textures/coworking-jt.jpg.jpg",
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
		url: "./textures/auditorio-11-jt.jpg",
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

function criarBotao(nome, texto, callback) {
	const botao = BABYLON.GUI.Button.CreateSimpleButton(nome, texto);
	botao.paddingBottom = "30px";
	botao.width = "160px";
	botao.height = "80px";
	botao.color = "black";
	botao.background = "white";
	botao.onPointerDownObservable.add(callback);
	return botao;
}

function criarBotaoImagem(indice) {
	return criarBotao("botaoImagem" + indice, imagens[indice].nome, function () {
		imagemAtual = indice;
		alternarMenu();
		criarDomo();
	});
}

function criarDomo() {
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
}

function alternarMenu() {
	if (menu) {
		camera.inputs.attached.pointers.attachControl(canvas);
		ui.removeControl(menu);
		menu = null;
	} else {
		camera.inputs.attached.pointers.detachControl(canvas);
		menu = new BABYLON.GUI.StackPanel("menu");

		for (let i = 0; i < imagens.length; i++) {
			if (i != imagemAtual)
				menu.addControl(criarBotaoImagem(i));
		}

		if (!window.modoXR)
			menu.addControl(criarBotao("botaoWebXR", "Modo WebXR", function () {
				window.location.href = "./webxr.html";
			}));

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

	criarDomo();

    ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

	const botao = criarBotao("locais", "Locais", alternarMenu);
	botao.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    botao.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
	ui.addControl(botao);
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

// WebGl suppport detector

if (!Detector.webgl) Detector.addGetWebGLMessage();

var container, stats;

var camera, scene, renderer, controls;
var mouseX = 0,
  mouseY = 0;

var object3d = {};
var oldMaterial = {};

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
var backDialMaterial = {};
var strapMaterial = {};
var textmesh = {};
var textureCanvas = {};
var textCanvas = document.querySelector("#textCanvas");
var engravedText = new THREE.Texture();
var backPlateMaterial = new THREE.MeshBasicMaterial({ map: engravedText });

//initailize
init();
animate();

function loadObject() {
  // progress loader
  var onProgress = function(xhr) {
    if (xhr.lengthComputable) {
      var percentComplete = (xhr.loaded / xhr.total) * 100;
      console.log(Math.round(percentComplete, 2) + "% downloaded");
      document.querySelector("#progressBar").value = percentComplete;
    }
  };

  var onError = function(xhr) {};

  // BEGIN Clara.io JSON loader code
  /*
  var objectLoader = new THREE.ObjectLoader(); //three.js:36170 THREE.JSONLoader: watch.scene-json/watch.json should be loaded with THREE.ObjectLoader instead.
  objectLoader.load(
    "apple-watch-threejs/app.json",
    //"https://dl.dropboxusercontent.com/s/1sbfsk9e7wkq8t9/apple-watch.json",
    function(obj) {
      object3d = obj;
      scene.add(obj);
      strapMaterial = object3d.children[1].children[0].children[5].material;
      backDialMaterial = object3d.children[1].children[0].children[0].material;
      oldMaterial = JSON.parse(
        JSON.stringify(object3d.children[1].children[0].children[5].material)
      );
    },
    onProgress,
    onError
  ); */
  // load newer object model

  THREE.Loader.Handlers.add(/\.dds$/i, new THREE.DDSLoader());

  new THREE.MTLLoader()
    .setPath("model/")
    .load("apple-watch.mtl", function(materials) {
      materials.preload();

      new THREE.OBJLoader()
        .setMaterials(materials)
        .setPath("model/")
        .load(
          "apple-watch.obj",
          function(object) {
            object3d = object;
            scene.add(object3d);
            strapMaterial = object3d.children[2].material;
            backDialMaterial = object3d.children[5].material;
            oldMaterial = JSON.parse(JSON.stringify(strapMaterial));
          },
          onProgress,
          onError
        );
    });
}

function init() {
  container = document.createElement("div");
  document.querySelector(".down").appendChild(container);
  camera = new THREE.PerspectiveCamera(
    50, //fov
    window.innerWidth / window.innerHeight,
    1,
    2000
  );
  controls = new THREE.OrbitControls(camera);
  // set camera position :
  //camera.position.set(0, 20, 100);
  camera.position.z = 20;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 3;
  controls.update();
  controls.enableDamping = false;

  // scene
  scene = new THREE.Scene();
  // adding lights to scene
  var ambient = new THREE.AmbientLight(0x444444, 1);
  scene.add(ambient);

  var directionalLight = new THREE.DirectionalLight(0xffeedd);
  directionalLight.position.set(0, 0, 1).normalize();
  scene.add(directionalLight);

  var spotLight = new THREE.SpotLight(0xffffff);
  spotLight.position.set(0, 200, 200);
  scene.add(spotLight);

  //load object
  loadObject();
  // JSON Loader format
  /*var loader = new THREE.ObjectLoader();
  loader.load("apple-watch.scene-json/apple-watch.json", function(object) {
    //scene.add(object);
  });
   */
  // END Clara.io JSON loader code
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);
  //document.addEventListener("mousemove", onDocumentMouseMove, false);
  //load text
  //engraveTextOnWatch("AA");
  window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize() {
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
function onDocumentMouseMove(event) {
  mouseX = (event.clientX - windowHalfX) / 2;
  mouseY = (event.clientY - windowHalfY) / 2;
}
//
function animate() {
  requestAnimationFrame(animate);
  render();
}
function render() {
  //camera.position.x += (mouseX - camera.position.x) * 0.05;
  //camera.position.y += (-mouseY - camera.position.y) * 0.05;
  camera.lookAt(scene.position);
  controls.update();
  renderer.render(scene, camera);
}

document.querySelector(".radio-grp-dial").addEventListener(
  "change",
  function(e) {
    var color = e.target.value;
    var newColor = new THREE.Color(color);
    backDialMaterial.color = newColor;
  },
  false
);

// to engrsave text on watch engraveSelect
// for loading textures
document.querySelector(".engraveSelect").addEventListener(
  "change",
  function(e) {
    e.currentTarget.checked ? engraveTextOnWatch() : clearCanvas();
  },
  false
);
// for loading textures
document.querySelector(".textureSelect").addEventListener(
  "change",
  function(e) {
    if (e.currentTarget.checked) {
      //load custom texture
      // load texture depending upon user
      var textureLoader = new THREE.TextureLoader();
      textureLoader.load("/textures/leather.jpg", function(tex) {
        var material = new THREE.MeshPhysicalMaterial({
          map: tex,
          depthWrite: true
        });
        object3d.children[2].material = material;
        // var light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
        // scene.add(light);
      });
    } else {
      //object3d.children[2].material = oldMaterial;
      loadObject();
    }
  },
  false
);

// event listners for control panel
document.querySelector(".radio-grp").addEventListener(
  "change",
  function(e) {
    console.log("clicked");
    var color = e.target.value;
    var newColor = new THREE.Color(color);
    strapMaterial.color = newColor;
  },
  false
);

//engraving text logic
document.querySelector("#engtxt").addEventListener(
  "input",
  function(e) {
    var val = e.currentTarget.value;
    console.log("engrave text : " + val);
    engraveTextOnWatch(val);
  },
  false
);

// engrave text
function engraveTextOnWatch(val = document.querySelector("#engtxt").value) {
  // add text upon watch's back dial
  clearCanvas();
  var context = textCanvas.getContext("2d");
  context.font = "30px Arial";
  //context.shadowColor = "red";
  context.fillStyle = "blue";
  context.fill();
  context.fillStyle = "green";
  context.textAlign = "center";
  context.textBaseline = "middle";
  draw3dText(context, val, 70, 70, 1);

  engravedText.image = textCanvas;
  engravedText.needsUpdate = true;
  object3d.children[5].material = backPlateMaterial;
  object3d.children[5].material.needsUpdate = true;

  var light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
  //scene.add(light);
}

function draw3dText(context, text, x, y, textDepth) {
  var n;
  // draw bottom layers
  for (n = 0; n < textDepth; n++) {
    context.fillText(
      text.split("").join(String.fromCharCode(46)),
      x - n,
      y - n
    );
  }
}

function clearCanvas() {
  var canvas = document.querySelector("#textCanvas");
  canvas.width = canvas.width;
}

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
//initailize
init();
animate();

function loadObject() {
  // progress loader
  var onProgress = function(xhr) {
    if (xhr.lengthComputable) {
      var percentComplete = xhr.loaded / xhr.total * 100;
      console.log(Math.round(percentComplete, 2) + "% downloaded");
      document.querySelector("#progressBar").value = percentComplete;
    }
  };

  var onError = function(xhr) {};

  // BEGIN Clara.io JSON loader code
  var objectLoader = new THREE.ObjectLoader(); //three.js:36170 THREE.JSONLoader: watch.scene-json/watch.json should be loaded with THREE.ObjectLoader instead.
  objectLoader.load(
    "apple-watch-threejs/apple-watch.json",
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
  );
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
  controls.autoRotateSpeed = 5;
  //controls.update();
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
  //engraveTextOnWatch("AKA");
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

        var watch_geo = object3d.children[1].children[0].children[5].geometry;
        var parent_obj = object3d.children[1].children[0].children[5].parent;

        object3d.children[1].children[0].children[5].material = material;

        var light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
        scene.add(light);
        engraveTextOnWatch();
      });
    } else {
      object3d.children[1].children[0].children[5].material = oldMaterial;
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
    object3d.children[1].children[0].children[5].material.color = newColor;
  },
  false
);

//engraving text logic
document.querySelector("#engtxt").addEventListener(
  "keydown",
  function(e) {
    var val = e.currentTarget.value;
    console.log("engrave text : " + val);
    dynamicTexture.clear().drawText(val, 2, 256, "orange");
  },
  false
);

// engrave text
function engraveTextOnWatch(val = "IWC") {
  dynamicTexture = new THREEx.DynamicTexture(512, 512);
  dynamicTexture.context.font = "bolder 90px Verdana";

  // watch back dial geometry & material where text needs to be engraved
  var backDialGeometry = object3d.children[1].children[0].children[0].geometry;
  var backDialMaterial = object3d.children[1].children[0].children[0].material;

  // geometry to add dynamic text
  var geometry = new THREE.CubeGeometry(1, 1, 1);
  var material = new THREE.MeshBasicMaterial({
    map: dynamicTexture.texture
  });
  var mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh); // adding mesh to scene , but this needs to be attache to watch's back dial geomtry
  /* tried adding dynamicTexture to watch back dial material, but this is not working , text not appearing */
  //backDialMaterial.map = dynamicTexture.texture;

  dynamicTexture.texture.needsUpdate = true;
  dynamicTexture.drawText(val, 2, 256, "orange");
}

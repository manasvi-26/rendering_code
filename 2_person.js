let camera, scene, renderer;

let actions,locations;
let timer= 0; 
let start_time = Date.now();
let total_time;
let models = []
let composer;
let files = []
let total_person ;

function readTextFile(file)
{
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
				var allText = rawFile.responseText;
				allText = allText.split("\n")
				files.push(allText[0])
				files.push(allText[0].replace("rotation", "translation"))
				total_person = allText[1]
				console.log("Total Person:" + total_person+"File:"+files)
            }
        }
    }
    rawFile.send(null);
}

readTextFile('./actionName.txt')

// files = [
// 	"./multi_person/rotation.json",
// 	"./multi_person/translation.json"
// ]




import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/postprocessing/RenderPass.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';


let joints_index = {
	0:'pelvis',
    1:'left_hip',
    2:'right_hip',
    3:'spine1',
    4:'left_knee',
    5:'right_knee',
	6:'spine2',
    7:'left_ankle',
    8:'right_ankle',
    9:'spine3',
    10:'left_foot',
    11:'right_foot',
    12:'neck',
    13:'left_collar',
    14:'right_collar',
    15:'head',
    16:'left_shoulder',
    17:'right_shoulder',
    18:'left_elbow',
    19:'right_elbow',
    20:'left_wrist',
    21:'right_wrist',
    22:'left_index1',
}

function swap(json){
	var ret = {};
	for(var key in json){
	  ret[json[key]] = [];
	}
	return ret;
}

let joints = swap(joints_index)
var size = 64;

init();
animate();

function loadModel(filePath,type){

	var loader = new GLTFLoader();
	loader.load( filePath, function ( gltf ) {

		var object = gltf.scene 
		object.traverse( function ( child ) {
			if ( child.isMesh ) {
				
				child.castShadow = true;
				child.receiveShadow = true;

			}

			if (child.name == "SMPLX-mesh-neutral"){

				var textureLoader = new THREE.TextureLoader();


				const texture = textureLoader.load('texture/smplx_texture_m_alb.png', function (texture){
					texture.flipY = false;
					child.material = new THREE.MeshStandardMaterial({map: texture, color: 'white',skinning: true});
				});

			}

			if (child.name == "SMPLX-mesh-female"){

				var textureLoader = new THREE.TextureLoader();


				const texture = textureLoader.load('texture/smplx_texture_f_alb.png', function (texture){
					texture.flipY = false;
					child.material = new THREE.MeshStandardMaterial({map: texture, color: 'white',skinning: true});
				});

			}



		} );
		
		scene.add( object );

		for (let [key, value] of Object.entries(joints)) {
			joints[key].push(object.getObjectByName(key))
		}

		object.scale.set(100,100,100)

		object.position.z += 80
		object.position.y += 120
		object.position.x += 20

		if(type =="male"){
			object.position.x += 80
			object.position.z -= 40
			object.position.y -= 40
			object.rotation.x -= Math.PI
		}
		if(type == "female"){
			object.position.x -= 10
		}

		const axesHelper = new THREE.AxesHelper( 10 );
        // scene.add( axesHelper );
        models.push(object);

	} );

}


function init() {

	// console.log(THREE.FBXLoader)
	const container = document.createElement( 'div' );
	document.body.appendChild( container );

	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
	camera.position.set( 50, 100, 400 );
	camera.lookAt(0,0,0)


	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xa0a0a0 );
	scene.fog = new THREE.Fog( 0xa0a0a0, 200, 1000 );

	const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
	hemiLight.position.set( 0, 200, 0 );
	scene.add( hemiLight );

	const dirLight = new THREE.DirectionalLight( 0xffffff );
	dirLight.position.set( 0, 200, 100 );
	dirLight.castShadow = true;
	dirLight.shadow.camera.top = 180;
	dirLight.shadow.camera.bottom = - 100;
	dirLight.shadow.camera.left = - 120;
	dirLight.shadow.camera.right = 120;



	scene.add( dirLight );


	scene.background = new THREE.Color( 0xeeeeee );
	// scene.add( new THREE.GridHelper( 400, 10 ) );


	// model
	loadModel('male.glb',"male")
	
	loadModel('ofemale.glb',"female")

    
    
	//action
	let loader2 = new THREE.FileLoader();
	loader2.load( files[0], function( data ) {
		actions = JSON.parse(data);

		actions = actions.rotation
		console.log("Rotation IS ", actions.length);
		total_time = actions.length
		size = actions.length
		// size = 40;

	})
	
	location
	loader2 = new THREE.FileLoader();
	loader2.load( files[1], function( data ) {
		data = JSON.parse(data);
		locations = data.translation
		console.log("LOCATIONS IS ", locations.shape);
		// total_time = locations.length
	})
	
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMap.enabled = true;
	container.appendChild( renderer.domElement );

	var renderModel = new RenderPass( scene, camera );


	const controls = new OrbitControls( camera, renderer.domElement );
	controls.target.set( 0, 100, 0 );
	controls.update();


	composer = new EffectComposer( renderer );
	composer.addPass( renderModel );


	// var capture = new THREEcap({composer : composer, scriptbase: './build/'});
	// var captureui = new THREEcapUI(capture);


	window.addEventListener( 'resize', onWindowResize );


}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}


function animate() {
	console.log("SIZE IS ",size)
	requestAnimationFrame( animate );
	
	size = 24;
	if(Date.now() - start_time > 100){
		timer = (timer + 1)%size;
		start_time = Date.now();

		let bar = (((timer-1)/size)*100)
		if(bar<=10){
			bar=0
		}
		if(bar>=90){
			bar=100
		}
		bar = Math.round(bar)
		// if(bar==99){
			// bar=100
		// }
		bar = bar.toString() + "%"
		// console.log(bar)
		document.getElementById("progress").innerHTML = bar
		document.getElementById("progress").style.width = bar		
	}
	
	// models[0].visible=false
    if(total_person == 1 & models.length > 1){
        models[1].visible = false;
    }

	joints['pelvis'][0].position.x = -locations[timer][0][0][0]
	joints['pelvis'][1].position.z = locations[timer][0][0][0] 



	// joints['pelvis'][0].position.set(
	// 		locations[timer][0][0][1],
	// 		0,
	// 		locations[timer][0][0][0], 
	// )
	// joints['pelvis'][1].position.set(
	// 		locations[timer][0][0][1] + locations[timer][1][0][1],
	// 		0,
	// 		-locations[timer][0][0][0] + locations[timer][1][0][1], 
	// )


	for ( let person = 0; person < total_person;person++){
		if(joints['pelvis'][person] === undefined)break;
		
				
		for (let joint=0;joint<52;joint++){


            if (joint == 0 & total_person==1){
                continue;
            }
            if(joint>22){
            	break
            }
            let bone = joints_index[joint] 
            if(files[0].includes("MUGL_old_baseline" )){
	            joints[bone][person].rotation.x = -actions[timer][person][joint][0]; 
	            joints[bone][person].rotation.y = -actions[timer][person][joint][1]; 
	            joints[bone][person].rotation.z = -actions[timer][person][joint][2]; 
            }
            else if(files[0].includes("ACTOR")){
	            joints[bone][person].rotation.x = actions[timer][person][joint][0]; 
	            joints[bone][person].rotation.y = actions[timer][person][joint][1]; 
	            joints[bone][person].rotation.z = actions[timer][person][joint][2]; 
            }
            else if(files[0].includes("MUGL") || files[0].includes("multi_person")){
            	joints[bone][person].setRotationFromQuaternion( new THREE.Quaternion(
                actions[timer][person][joint][0], 
                actions[timer][person][joint][1],
                actions[timer][person][joint][2],
                actions[timer][person][joint][3] 
            ))
			}
			else if(files[0].includes("DSAG_XPOSE")){
            	joints[bone][person].setRotationFromQuaternion( new THREE.Quaternion(
                actions[timer][person][joint][0], 
                actions[timer][person][joint][1],
                actions[timer][person][joint][2],
                actions[timer][person][joint][3] 
            ))
			}
			else if(files[0].includes("MULTI")){
            	joints[bone][person].setRotationFromQuaternion( new THREE.Quaternion(
                actions[timer][person][joint][0], 
                actions[timer][person][joint][1],
                actions[timer][person][joint][2],
                actions[timer][person][joint][3] 
            ))
			}
			else if(files[0].includes("GROUND")){
            	joints[bone][person].setRotationFromQuaternion( new THREE.Quaternion(
                actions[timer][person][joint][0], 
                actions[timer][person][joint][1],
                actions[timer][person][joint][2],
                actions[timer][person][joint][3] 
            ))
			}
			else if(files[0].includes("Thumb")){
            	joints[bone][person].setRotationFromQuaternion( new THREE.Quaternion(
                actions[timer][person][joint][0], 
                actions[timer][person][joint][1],
                actions[timer][person][joint][2],
                actions[timer][person][joint][3] 
            ))
            }
            else if(files[0].includes("uestc")){
	            joints[bone][person].rotation.x = -actions[timer][person][joint][0]; 
	            joints[bone][person].rotation.y = -actions[timer][person][joint][1]; 
	            joints[bone][person].rotation.z = -actions[timer][person][joint][2]; 
            }
            else if(files[0].includes("DSAG")){
	            joints[bone][person].rotation.x = actions[timer][person][joint][0]; 
	            joints[bone][person].rotation.y = actions[timer][person][joint][1]; 
	            joints[bone][person].rotation.z = actions[timer][person][joint][2]; 
            }
            else if(files[0].includes("h36")){
	            joints[bone][person].rotation.x = -actions[timer][person][joint][0]; 
	            joints[bone][person].rotation.y = -actions[timer][person][joint][1]; 
	            joints[bone][person].rotation.z = -actions[timer][person][joint][2]; 
            }


            if(joint == 0) joints[bone][person].rotation.y  = - Math.PI/2
            if(joint == 0) joints[bone][1].rotation.y  = 0
            if(joint == 0) joints[bone][1].rotation.x  = 0
			if(joint == 0) joints[bone][1].rotation.z  = -1.54
			
			



        }
	}



	composer.render( 0.01 );
	renderer.render( scene, camera );

}
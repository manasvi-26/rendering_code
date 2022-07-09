import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/postprocessing/RenderPass.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';


let canvas, renderer;
const scenes = [];
let models = []
let files = []

let original_run_time = Date.now()

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
                
                files.push("WACV_ALL_DATA/TRUTH/" + allText[0] + "/sample" + allText[1] + ".json")
                files.push("WACV_ALL_DATA/DSAG/" + allText[0] + "/sample" + allText[2] + ".json")
                files.push("WACV_ALL_DATA/ACTOR_DATA/" + allText[0] + "/sample" + allText[3] + ".json")
                files.push("WACV_ALL_DATA/MUGL/" + allText[0] + "/sample" + allText[4] + ".json")

            }
        }
    }
    rawFile.send(null);
}

readTextFile('./action.txt')


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
    23:'left_index2',
    24:'left_index3',
    25:'left_middle1',
    26:'left_middle2',
    27:'left_middle3',
    28:'left_pinky1',
    29:'left_pinky2',
    30:'left_pinky3',
    31:'left_ring1',
    32:'left_ring2',
    33:'left_ring3',
    34:'left_thumb1',
    35:'left_thumb2',
    36:'left_thumb3',
    37:'right_index1',
    38:'right_index2',
    39:'right_index3',
    40:'right_middle1',
    41:'right_middle2',
    42:'right_middle3',
    43:'right_pinky1',
    44:'right_pinky2',
    45:'right_pinky3',
    46:'right_ring1',
    47:'right_ring2',
    48:'right_ring3',
    49:'right_thumb1',
    50:'right_thumb2',
    51:'right_thumb3',
	
}

function swap(json){
	var ret = {};
	for(var key in json){
	  ret[json[key]] = "bone";
	}
	return ret;
}


function loadModel(filePath,scene){

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

        } );



        object.scale.set(15, 15, 15)
        object.position.set(0,4.5,0)

        scene.userData.joints = swap(joints_index)

        scene.add(object)


        for (let [key, value] of Object.entries(scene.userData.joints)) {
            scene.userData.joints[key] = object.getObjectByName(key)
        }
        
        models.push(object);

    } );
    
}

init();
animate();

function loadAction(filePath,scene){
    let loader = new THREE.FileLoader();
	loader.load( filePath, function( data ) {
		let actions = JSON.parse(data);
        actions = actions.rotation
        scene.userData.actions = actions;
        scene.userData.totalTime = actions.length;
        if(scene.userData.modelName == "MUGL")scene.userData.totalTime = 50;
        if(scene.userData.modelName == "GROUND")scene.userData.totalTime = 45;
        
    })
}

function init() {

    canvas = document.getElementById( "c" );
    // model
   
    
    const geometries = [
        new THREE.BoxGeometry( 1, 1, 1 ),
        new THREE.SphereGeometry( 0.5, 12, 8 ),
        new THREE.DodecahedronGeometry( 0.5 ),
        new THREE.CylinderGeometry( 0.5, 0.5, 1, 12 )
    ];

    const content = document.getElementById( 'content' );

    let modelName = ["GROUND TRUTH", "DSAG",  "ACTOR", "MUGL"]

    for ( let i = 0; i < 4; i ++ ) {

        const scene = new THREE.Scene();

        // make a list item
        const element = document.createElement( 'div' );
        element.className = 'list-item';

        const sceneElement = document.createElement( 'div' );
        element.appendChild( sceneElement );

        const descriptionElement = document.createElement( 'div' );
        descriptionElement.innerText = modelName[i];
        element.appendChild( descriptionElement );

        // the element that represents the area we want to render the scene
        scene.userData.element = sceneElement;
        content.appendChild( element );

        const camera =  new THREE.PerspectiveCamera(50,1,1,800);
        camera.position.z = 35;
        camera.position.y = 5;
        camera.position.x = 5;

        scene.userData.modelName = modelName[i]

        scene.userData.camera = camera;

        const controls = new OrbitControls( scene.userData.camera, scene.userData.element );
        scene.userData.controls = controls;
        
        scene.timer = 0;
        scene.start_time = Date.now()

        
	    loadModel('male.glb', scene)
        
        scene.add( new THREE.HemisphereLight( 0xaaaaaa, 0x444444 ) );
        
        const light = new THREE.DirectionalLight( 0xffffff, 0.5 );
        light.position.set( 1, 1, 1 );
        scene.add( light );

        scenes.push( scene );
        loadAction(files[i], scene)
    }

    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );
    renderer.setClearColor( 0xffffff, 1 );
    renderer.setPixelRatio( window.devicePixelRatio );

}

function updateSize() {

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if ( canvas.width !== width || canvas.height !== height ) {

        renderer.setSize( width, height, false );

    }

}

function animate() {

    render();
    requestAnimationFrame( animate );

}



function render() {

    updateSize();

    canvas.style.transform = `translateY(${window.scrollY}px)`;

    renderer.setClearColor( 0xffffff );
    renderer.setScissorTest( false );
    renderer.clear();

    renderer.setClearColor( 0xe0e0e0 );
    renderer.setScissorTest( true );

    
    
    var index = 0
    scenes.forEach( function ( scene ) {
        if(scene.userData.joints == undefined)return;
        if(scene.userData.totalTime == undefined)return;
        index += 1
        
        var fps = 100;
        if(scene.userData.modelName == "DSAG")fps = 200;

        if((Date.now() - original_run_time > 5000) && (Date.now() - scene.start_time > fps)){
            scene.timer = (scene.timer + 1);
            scene.start_time = Date.now();

            let bar = (((scene.timer-1)/scene.userData.totalTime)*100)
            if(bar<=10){
                bar=0
            }
            if(bar>=90){
                bar=100
            }
            bar = Math.round(bar)
            
            bar = bar.toString() + "%"

            
            document.getElementById("p"+index).innerHTML = bar
		    document.getElementById("p"+index).style.width = bar	
            
        }

        if(scene.timer >= scene.userData.totalTime){
            for (let joint=1;joint<52;joint++){
                let bone = joints_index[joint]
                scene.userData.joints[bone].setRotationFromQuaternion( 
                    new THREE.Quaternion(0,0,0,1)
                )
            }
        }
        else{
            for (let joint=1;joint<52;joint++){
                let bone = joints_index[joint]
                scene.userData.joints[bone].setRotationFromQuaternion( new THREE.Quaternion(
                    scene.userData.actions[scene.timer][0][joint][0], 
                    scene.userData.actions[scene.timer][0][joint][1],
                    scene.userData.actions[scene.timer][0][joint][2],
                    scene.userData.actions[scene.timer][0][joint][3] 
                ))
            }
        
        }

        if(Date.now() - original_run_time < 5000){
            for (let joint=1;joint<52;joint++){
                let bone = joints_index[joint]
                scene.userData.joints[bone].setRotationFromQuaternion( 
                    new THREE.Quaternion(0,0,0,1)
                )
            }
        }
        

        const element = scene.userData.element;

        const rect = element.getBoundingClientRect();

        if ( rect.bottom < 0 || rect.top > renderer.domElement.clientHeight ||
             rect.right < 0 || rect.left > renderer.domElement.clientWidth ) {

            return; // it's off screen

        }

        const width = rect.right - rect.left;
        const height = rect.bottom - rect.top;
        const left = rect.left;
        const bottom = renderer.domElement.clientHeight - rect.bottom;

        renderer.setViewport( left, bottom, width, height );
        renderer.setScissor( left, bottom, width, height );

        const camera = scene.userData.camera;

        renderer.render( scene, camera );

    } );

}

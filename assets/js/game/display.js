var DISPLAY =
{
	ms_Canvas: null,
	ms_Renderer: null,
	ms_Camera: null, 
	ms_Scene: null, 
	ms_Controls: null,
	ms_Terrain: null,
	ms_Light: null,
	ms_CloseLight: null,
	ms_Animals: null,
	
	ms_Player: null,
	
	Enable: ( function() 
	{
        try 
		{
			var aCanvas = document.createElement( 'canvas' ); 
			return !! window.WebGLRenderingContext && ( aCanvas.getContext( 'webgl' ) || aCanvas.getContext( 'experimental-webgl' ) ); 
		} 
		catch( e ) { return false; } 
	} )(),
	
	Initialize: function( inIdCanvas )
	{		
		this.ms_Clock = new THREE.Clock();
		this.ms_Canvas = $( '#'+inIdCanvas );
		
		// Initialize Renderer, Camera and Scene
		this.ms_Renderer = this.Enable? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();
		this.ms_Canvas.html( this.ms_Renderer.domElement );
		this.ms_Scene = new THREE.Scene();
		
		this.ms_Camera = new THREE.PerspectiveCamera( 55.0, Window.ms_Width / Window.ms_Height, 0.01, 20000 );
		this.ms_Camera.position.set( 13, 1.5, 4 );
		
		// Initialize Orbit control		
		this.ms_Controls = new THREE.OrbitControls( this.ms_Camera, this.ms_Renderer.domElement );
		this.ms_Controls.userPanSpeed = 0.15;
	
		// Add lights
		this.ms_Renderer.shadowMapEnabled = true;
		this.ms_Renderer.shadowMapType = THREE.PCFSoftShadowMap;
		
		this.ms_Light = new THREE.DirectionalLight( 0xffddaa, 1 );
		this.ms_Light.castShadow = true;
		this.ms_Light.position.set( -1100, 800, -250 );
		this.ms_Light.shadowCameraNear = 410;
		this.ms_Light.shadowCameraFar = 1370;
		this.ms_Light.shadowCameraLeft = -200;
		this.ms_Light.shadowCameraRight = 200;
		this.ms_Light.shadowCameraTop = 200;
		this.ms_Light.shadowCameraBottom = -200;
		this.ms_Light.shadowMapWidth = 512;
		this.ms_Light.shadowMapHeight = 512;
		this.ms_Light.shadowBias = -0.0018;
		this.ms_Light.shadowDarkness = 0.7;
		
		console.log( this.ms_Light );
		
		this.ms_CloseLight = new THREE.DirectionalLight( 0xffffff, 0 );
		this.ms_CloseLight.castShadow = true;
		this.ms_CloseLight.onlyShadow = true;
		this.ms_CloseLight.shadowCameraNear = 1;
		this.ms_CloseLight.shadowCameraFar = 40;
		this.ms_CloseLight.shadowCameraLeft = -20;
		this.ms_CloseLight.shadowCameraRight = 20;
		this.ms_CloseLight.shadowCameraTop = 20;
		this.ms_CloseLight.shadowCameraBottom = -20;
		this.ms_CloseLight.shadowMapWidth = 1024;
		this.ms_CloseLight.shadowMapHeight = 1024;
		this.ms_CloseLight.shadowDarkness = 0.7;
		this.ms_CloseLight.shadowBias = -0.0004;
		this.ms_CloseLight.position.set( -22, 20, -13 );
		
		this.ms_Scene.add( new THREE.AmbientLight( 0x404040 ) );
		
		// Add skybox
		var aSkyDome = new THREE.Mesh(
			new THREE.SphereGeometry( 10000, 15, 15 ),
			new THREE.MeshBasicMaterial( {
				map: THREE.ImageUtils.loadTexture( "assets/img/skydome.jpg" ),
				color: 0xffffff,
				side: THREE.DoubleSide
			} )
		);
		aSkyDome.rotation.y = Math.PI;
		this.ms_Scene.add( aSkyDome );
		
		//this.ms_CloseLight.shadowCameraVisible = true;
		//this.ms_Light.shadowCameraVisible = true;
		
		this.LoadTerrain();
		this.GenerateAnimals();
	},
	
	LoadTerrain: function()
	{
		//this.ms_Camera.position.set( this.ms_Parameters.width * 0.5, this.ms_Parameters.width/15, this.ms_Parameters.height * 0.5 );
		var terrainGeo = TERRAINGEN.Get( GAME.ms_Parameters );
		var terrainMaterial = new THREE.MeshPhongMaterial( { vertexColors: THREE.VertexColors, shading: THREE.FlatShading, specular: 0xffffff } );
		
		this.ms_Terrain = new THREE.Mesh( terrainGeo, terrainMaterial );
		
		this.ms_Scene.add( this.ms_Terrain );
		this.ms_Terrain.receiveShadow = true;
		this.ms_Terrain.castShadow = false;
	},
	
	GetDepth: function( inX, inY )
	{
		return this.ms_Terrain.geometry.vertices[ inY * GAME.ms_Parameters.widthSegments + inX ].y;
	},
	
	LoadAnimals: function( inType )
	{
		MESHES.Load( inType, function( inGeometry ) {
			for( var i = 0; i < 300; ++i )
			{
				var mesh = MESHES.AddMorph( inGeometry );
				var x = ( 0.5 + Math.random() * 0.5 ) * GAME.ms_Parameters.widthSegments/2 - GAME.ms_Parameters.widthSegments/8;
				var z = ( 0.005 + Math.random() * 0.99 ) * GAME.ms_Parameters.heightSegments - GAME.ms_Parameters.heightSegments/2;
				
				mesh.position.x = x * GAME.ms_Parameters.width / GAME.ms_Parameters.widthSegments;
				mesh.position.z = z * GAME.ms_Parameters.height / GAME.ms_Parameters.heightSegments;
				mesh.rotation.set( 0, Math.random() * Math.PI * 2, 0 );
				
				mesh.position.y = DISPLAY.GetDepth( Math.round( GAME.ms_Parameters.widthSegments / 2 + x ), Math.round( GAME.ms_Parameters.heightSegments / 2 + z ) );
				mesh.scale.set( 0.03, 0.03, 0.03 );
				mesh.castShadow = true;
				mesh.receiveShadow = false;
				
				DISPLAY.ms_Animals.add( mesh );
			}
		} );
	},
	
	GenerateAnimals: function()
	{
		this.ms_Animals = new THREE.Object3D();
		this.ms_Scene.add( this.ms_Animals );
		this.LoadAnimals( MESHES.Type.Cow );
	},
	
	Display: function()
	{
		this.ms_Renderer.render( this.ms_Scene, this.ms_Camera );
	},
	
	Update: function( inUpdate )
	{
		MESHES.Update( inUpdate );
		
		this.ms_Controls.update();
		this.Display();
	},
	
	Resize: function( inWidth, inHeight )
	{
		this.ms_Camera.aspect =  inWidth / inHeight;
		this.ms_Camera.updateProjectionMatrix();
		this.ms_Renderer.setSize( inWidth, inHeight );
		this.ms_Canvas.html( this.ms_Renderer.domElement );
	}
};
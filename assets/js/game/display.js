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
	ms_Water: null,	
	
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
		this.ms_Controls.userPanSpeed = 2.5;
		this.ms_Controls.maxPolarAngle = Math.PI * 0.51;
		this.ms_Controls.maxDistance = 100.0;
	
		// Add lights with shadows
		this.ms_Renderer.shadowMapEnabled = true;
		this.ms_Renderer.shadowMapType = THREE.PCFSoftShadowMap;
		
		this.ms_Light = new THREE.DirectionalLight( 0xffddaa, 1 );
		this.ms_Light.castShadow = true;
		this.ms_Light.position.set( -1100, 800, -250 );
		this.ms_Light.shadowCameraNear = 1150;
		this.ms_Light.shadowCameraFar = 1370;
		this.ms_Light.shadowCameraLeft = -200;
		this.ms_Light.shadowCameraRight = 200;
		this.ms_Light.shadowCameraTop = 200;
		this.ms_Light.shadowCameraBottom = -200;
		this.ms_Light.shadowMapWidth = 512;
		this.ms_Light.shadowMapHeight = 512;
		this.ms_Light.shadowBias = -0.0018;
		this.ms_Light.shadowDarkness = 0.7;
		
		this.ms_CloseLight = new THREE.DirectionalLight( 0xffffff, 0 );
		this.ms_CloseLight.castShadow = true;
		this.ms_CloseLight.onlyShadow = true;
		this.ms_CloseLight.shadowCameraNear = 1;
		this.ms_CloseLight.shadowCameraFar = 40;
		this.ms_CloseLight.shadowCameraLeft = -20;
		this.ms_CloseLight.shadowCameraRight = 20;
		this.ms_CloseLight.shadowCameraTop = 20;
		this.ms_CloseLight.shadowCameraBottom = -20;
		this.ms_CloseLight.shadowMapWidth = 512;
		this.ms_CloseLight.shadowMapHeight = 512;
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
		
		// Create the water effect
		var waterNormals = new THREE.ImageUtils.loadTexture( 'assets/img/waternormals.jpg' );
		waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping; 
		this.ms_Light.position.set( -1100, 800, -250 );
		this.ms_Water = new THREE.Water( this.ms_Renderer, this.ms_Camera, this.ms_Scene, {
			textureWidth: 256, 
			textureHeight: 256,
			waterNormals: waterNormals,
			alpha: 	0.5,
			sunDirection: ( new THREE.Vector3( -1100, 800, 0 ) ).normalize(),
			sunColor: 0xffffff,
			waterColor: 0x001e0f,
			distortionScale: 15.0,
			noiseScale: 0.1,
			clipBias: -0.02,
		} );
		var aMeshMirror = new THREE.Mesh(
			new THREE.PlaneGeometry( GAME.ms_Parameters.width * 0.85, GAME.ms_Parameters.height, 10, 10 ), 
			this.ms_Water.material
		);
		aMeshMirror.add( this.ms_Water );
		aMeshMirror.position.y = 15;
		aMeshMirror.rotation.x = - Math.PI * 0.5;
		this.ms_Scene.add( aMeshMirror );
		
		//this.ms_CloseLight.shadowCameraVisible = true;
		//this.ms_Light.shadowCameraVisible = true;
	},
	
	GetDepth: function( inX, inY )
	{
		return this.ms_Terrain.geometry.vertices[ inY * GAME.ms_Parameters.widthSegments + inX ].y;
	},
	
	Display: function()
	{
		this.ms_Water.render();
		this.ms_Renderer.render( this.ms_Scene, this.ms_Camera );
	},
	
	Update: function( inUpdate )
	{
		this.ms_Water.material.uniforms.time.value += 1.0 / 60.0;
		
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
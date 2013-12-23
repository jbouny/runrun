var CONV =
{
	ms_WorldRatio: 0.0,
	ms_WorldOffsetX: 0.0,
	ms_WorldOffsetY: 0.0,
	ms_WorldOffsetZ: 0.0,
	
	To3D: function( inCoord )
	{
		inCoord.z = this.ms_WorldOffsetZ - inCoord.x * this.ms_WorldRatio;
		inCoord.y = this.ms_WorldOffsetY + inCoord.y * this.ms_WorldRatio;
		inCoord.x = this.ms_WorldOffsetX;
	},
	
	To3DS: function( inCoord )
	{
		inCoord.z = this.ms_WorldOffsetZ - inCoord.x// * this.ms_WorldRatio;
		//inCoord.y = inCoord.y * this.ms_WorldRatio;
		inCoord.x = this.ms_WorldOffsetX;
	},
	
	ToVector3D: function( inCoord )
	{
		this.To3D( inCoord );
		return new THREE.Vector3( inCoord.x, inCoord.y, inCoord.z );
	},
	ToVector2D: function( inCoord )
	{
		this.To3D( inCoord );
		return new THREE.Vector2( inCoord.z, inCoord.y );
	},
	
	XTo3D: function( inX ) { return this.ms_WorldOffsetZ - inX * this.ms_WorldRatio; },
	YTo3D: function( inY ) { return this.ms_WorldOffsetY + inY * this.ms_WorldRatio; },
	GetX: function() { return this.ms_WorldOffsetX; },
	
	SizeTo3D: function( inSize ) { return ( inSize || 1 ) * this.ms_WorldRatio }
}

var PLAYER =
{
	ms_Mesh: null,
	ms_B2DBody: null,
	ms_Group: null,
	ms_GroupHeight: null,
	ms_Speed: 15.0,
	ms_Jump: 17.0,
	ms_Size: {
		x: 0.25,
		y: 0.12
	},

	Initialize: function()
	{
		//this.ms_Speed = GAME.ms_Parameters.width
	
		// Load the player model (fox)
		MESHES.Load( MESHES.Type.Fox, function( inGeometry ) {
			var aMesh = MESHES.AddMorph( inGeometry );
			aMesh.rotation.set( 0, Math.PI, 0);
			aMesh.scale.set( 0.03, 0.03, 0.03 );
			aMesh.castShadow = true;
			aMesh.receiveShadow = false;
			PLAYER.ms_Mesh.add( aMesh );
			aMesh.position.y = -0.7;
		} );
		
		// Load a companion
		MESHES.Load( MESHES.Type.Parrot, function( inGeometry ) {
			var aMesh = MESHES.AddMorph( inGeometry );
			aMesh.rotation.set( 0, Math.PI, 0);
			aMesh.scale.set( 0.03, 0.03, 0.03 );
			aMesh.castShadow = true;
			aMesh.receiveShadow = false;
			PLAYER.ms_Group.add( aMesh );
			aMesh.position.x = 4;
			aMesh.position.y = 5;
			aMesh.position.z = 4;
		} );
		
		// Load an other companion
		MESHES.Load( MESHES.Type.Elk, function( inGeometry ) {
			var aMesh = MESHES.AddMorph( inGeometry );
			aMesh.rotation.set( 0, Math.PI, 0);
			aMesh.scale.set( 0.03, 0.03, 0.03 );
			aMesh.castShadow = true;
			aMesh.receiveShadow = false;
			PLAYER.ms_Group.add( aMesh );
			aMesh.position.x = -6;
			aMesh.position.y = -1;
			aMesh.position.z = 8;
		} );
		
		// Group that define all elements following the player
		this.ms_Group = new THREE.Object3D();
		this.ms_GroupHeight = new THREE.Object3D();
		
		// The player is itself a group (can contains some elements)
		this.ms_Mesh = new THREE.Object3D();
		this.ms_Group.position.x = CONV.GetX();
		this.ms_Group.position.y = CONV.YTo3D( 0 );
	
		// Define the physic of the player
        var aShape = new Box2D.b2PolygonShape();
        aShape.SetAsBox( this.ms_Size.x * 0.5, this.ms_Size.y * 0.5 );
		var aBd = new Box2D.b2BodyDef();
		aBd.set_type( Box2D.b2_dynamicBody );
		aBd.set_position( new Box2D.b2Vec2( 2, this.ms_Size.y ) );
		this.ms_B2DBody = GAME.ms_B2DWorld.CreateBody( aBd );
		this.ms_B2DBody.CreateFixture( aShape, 0.5 );
		this.ms_B2DBody.SetAwake( 1 );
		this.ms_B2DBody.SetActive( 1 );
		
		// Add a cube in the player in order to see the physical box
		/*this.ms_Mesh.add( new THREE.Mesh( 
			new THREE.CubeGeometry( 0.05, CONV.SizeTo3D( this.ms_Size.y+0.02 ), CONV.SizeTo3D( this.ms_Size.x ) ), 
			new THREE.MeshNormalMaterial() ) 
		);*/
		
		// Add all elements to the scene
		this.ms_GroupHeight.add( this.ms_Mesh );
		this.ms_GroupHeight.add( DISPLAY.ms_Camera ) ;
		this.ms_Group.add( this.ms_GroupHeight ) ;
		DISPLAY.ms_Scene.add( this.ms_Group );
		
		// Shadows follow the player in order to optimize their computing
		this.ms_Group.add( DISPLAY.ms_Light ) ;
		this.ms_Group.add( DISPLAY.ms_Light.target );
		DISPLAY.ms_Light.target.position.set( - 0.8 * GAME.ms_Parameters.heightSegments, 0, - 0.3 * GAME.ms_Parameters.heightSegments );

		// Idem for close light	
		this.ms_Group.add( DISPLAY.ms_CloseLight ) ;
		this.ms_Group.add( DISPLAY.ms_CloseLight.target );
		DISPLAY.ms_CloseLight.target.position.set( 0, 0, -8 );
		//DISPLAY.ms_Light.target.position.set( - 0.8 * GAME.ms_Parameters.heightSegments, 0, - 0.3 * GAME.ms_Parameters.heightSegments );
	},

	Update: function()
	{		
		// Apply constant velocity
		var aVelocity = this.ms_B2DBody.GetLinearVelocity();
		aVelocity.set_x( this.ms_Speed );
		this.ms_B2DBody.SetLinearVelocity( aVelocity );
		
		// Disable the player rotation effect
		this.ms_B2DBody.SetAngularVelocity( this.ms_B2DBody.GetAngularVelocity() * 0.7 );
		
		// Put slowly the up vector of the player to the top
		var aAngle = this.ms_B2DBody.GetAngle();
		this.ms_B2DBody.SetTransform( this.ms_B2DBody.GetPosition(), aAngle * 0.96 );
		
		var aData = {};
		GAME.B2DReadObject( aData, this.ms_B2DBody );
		CONV.To3DS( aData );
		this.ms_Group.position.z = aData.z;
		this.ms_GroupHeight.position.y = aData.y;
		if( this.ms_Mesh != null )
			this.ms_Mesh.rotation.x = aData.angle;
			
		TERRAIN.Update( this.ms_Group.position.z );
	},
	
	Jump: function()
	{
		var aVelocity = this.ms_B2DBody.GetLinearVelocity();
		aVelocity.set_y( this.ms_Jump );
		this.ms_B2DBody.SetLinearVelocity( aVelocity );
	}
};

var GROUND =
{
	ms_Ground : null,
	
	Initialize: function( inParameters )
	{		
        var aEdgeShape = new Box2D.b2EdgeShape();
		var aGroundPoints = [];
		
		aGroundPoints.push( CONV.ToVector2D( { x: 3, y: -0.1 } ) );
		for( var i = 3; i < inParameters.heightSegments; i += 1.2 )
		{
			var x1 = i, x2 = i + 1, y = RAND_MT.Random() * 0.5;
			
			aEdgeShape.Set( new Box2D.b2Vec2( x1, 0 ), new Box2D.b2Vec2( x2, y ) );
			GAME.ms_B2DWorld.CreateBody( new Box2D.b2BodyDef() ).CreateFixture( aEdgeShape, 0.0 );
			
			aGroundPoints.push( CONV.ToVector2D( { x: x1, y: 0 } ) );
			aGroundPoints.push( CONV.ToVector2D( { x: x2, y: y } ) );
		}
		aGroundPoints.push( CONV.ToVector2D( { x: inParameters.heightSegments, y: -0.1 } ) );
		var aGroundShape = new THREE.Shape( aGroundPoints );
		
		var aExtrusionSettings = {
			bevelEnabled: false,
			material: 0, amount: 1.5
		};
	
		var aGround = new THREE.Mesh( 
			new THREE.ExtrudeGeometry( aGroundShape, aExtrusionSettings ), 
			new THREE.MeshPhongMaterial( { color: 0xA2F5A9, ambient: 0xA2F5A9, specular:0xffffff } ) 
		);
		aGround.rotation.y = - 0.5 * Math.PI;
		aGround.position.x = CONV.GetX() + 0.5;
		aGround.castShadow = true;
		aGround.receiveShadow = true;
		
		this.ms_Ground = new THREE.Object3D();
		this.ms_Ground.add( aGround );
		DISPLAY.ms_Scene.add( this.ms_Ground );
	}
};

var GAME =
{
	ms_B2DWorld: null,
	ms_B2DShape: null,
	ms_Parameters: null,
	ms_HeightMap: null,
	ms_Clock: null,
	ms_Iteration: 0,
	
	Initialize: function( inIdCanvas )
	{
		this.ms_HeightMap = TERRAINGEN.CreateCanvas( 0, 0 );
		this.ms_Parameters = {
			alea: RAND_MT,
			generator: PN_GENERATOR,
			width: 500,
			height: 5000,
			widthSegments: 50,
			heightSegments: 500,
			depth: 200,
			param: 6,
			filterparam: 1,
			filter: [ GAMETERRAIN_FILTER ],
			postgen: [ MOUNTAINS2_COLORS ],
			effect: [ DESTRUCTURE_EFFECT ],
			canvas: this.ms_HeightMap,
			step: 15
		};
		this.ms_Clock = new THREE.Clock();
		
		CONV.ms_WorldRatio = GAME.ms_Parameters.height / GAME.ms_Parameters.heightSegments;
		//CONV.ms_WorldOffsetZ = GAME.ms_Parameters.height * 0.5;
		CONV.ms_WorldOffsetY = GAME.ms_Parameters.depth * 0.10;
		CONV.ms_WorldOffsetX = GAME.ms_Parameters.width * 0.42;
	
		MESHES.Initialize();
		this.B2DInitialize( this.ms_Parameters );
		DISPLAY.Initialize( inIdCanvas );
		PLAYER.Initialize();
		
		TERRAIN.Initialize( DISPLAY.ms_Scene, this.ms_Parameters );
		
		//GROUND.Initialize( this.ms_Parameters );
	},
	
	B2DInitialize: function( inParameters )
	{	
		var aGravity = new Box2D.b2Vec2( 0.0, -32.0 );
		this.ms_B2DWorld = new Box2D.b2World( aGravity, true );
		
        var aEdgeShape = new Box2D.b2EdgeShape();
        aEdgeShape.Set( new Box2D.b2Vec2( 0, 0 ), new Box2D.b2Vec2( 10000, 0 ) );
        this.ms_B2DWorld.CreateBody( new Box2D.b2BodyDef() ).CreateFixture( aEdgeShape, 0.0 );
	},
	
	B2DReadObject: function( inData, inBody )
	{
		var aPos = inBody.GetPosition();
		inData.x = aPos.get_x();
		inData.y = aPos.get_y();
		inData.angle = inBody.GetAngle();
	},
	
	Update: function()
	{
		var aDelta = this.ms_Clock.getDelta();
		
		this.ms_B2DWorld.Step(
			aDelta,
			20,			// velocity iterations
			20			// position iterations
		);
		PLAYER.Update( aDelta );
		
		for( var i = this.ms_Iteration % 2; i < TERRAIN.ms_Blocks.length; i += 2 )
		{
			var aSize = TERRAIN.ms_Blocks[i].cows.children.length * 1.0;
			var position = Object.create( PLAYER.ms_Group.position );
			TERRAIN.ms_Blocks[i].cows.worldToLocal( position );
			for( var j = 0; j < aSize; ++j )
			{
				TERRAIN.ms_Blocks[i].cows.children[j].lookAt( position );
			}
		}
		//	DISPLAY.ms_Animals.children[i].lookAt( PLAYER.ms_Group.position );
		++ this.ms_Iteration;
		DISPLAY.Update( aDelta );
	},
	
	Jump: function()
	{
		PLAYER.Jump();
	},
};
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
		inCoord.z = this.ms_WorldOffsetZ - inCoord.x * this.ms_WorldRatio;
		inCoord.y = inCoord.y * this.ms_WorldRatio;
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
	ms_Speed: 2,
	ms_Jump: 2,
	ms_Size: {
		x: 0.25,
		y: 0.12
	},

	Initialize: function()
	{
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
	},
	
	Jump: function()
	{
		var aVelocity = this.ms_B2DBody.GetLinearVelocity();
		aVelocity.set_y( this.ms_Jump );
		this.ms_B2DBody.SetLinearVelocity( aVelocity );
	}
}

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
}

var TREES =
{
	ms_Geometry: null,
	ms_Trees: null,
	ms_Materiel: null,
	
	Initialize: function()
	{
		// Create pyramide
		var aMesh = new THREE.Mesh( new THREE.CylinderGeometry( 0, 4, 10, 4, 1 ), new THREE.MeshNormalMaterial() );
		aMesh.position.set( 0, 6, 0 );
		
		// Merge it width a deformed cube to make the bottom
		this.ms_Geometry = new THREE.CubeGeometry( 0.5, 2, 0.5, 1, 1, 1 );
		THREE.GeometryUtils.merge( this.ms_Geometry, aMesh );
		
		// Initialize the group of trees and material
		this.ms_Trees = new THREE.Object3D();
		this.ms_Material = new THREE.MeshPhongMaterial( { color: 0x006600, ambient: 0x006600, shading: THREE.FlatShading } );
		
		// Generate trees
		this.GenerateTrees( 1000 );
		
		// Add the final group to the scene
		DISPLAY.ms_Scene.add( this.ms_Trees );
	},
	
	GenerateClosedTrees: function()
	{
	},
	
	GenerateTrees: function( inNbTrees )
	{
		var aTreeGeometry = new THREE.Geometry();
		
		for( var i = 0; i < inNbTrees; ++i )
		{			
			var x = ( 0.2 + RAND_MT.Random() * 0.7 ) * GAME.ms_Parameters.widthSegments - GAME.ms_Parameters.widthSegments / 2;
			var z = ( 0.01 + RAND_MT.Random() * 0.98 ) * GAME.ms_Parameters.heightSegments - GAME.ms_Parameters.heightSegments / 2;
			var y = DISPLAY.GetDepth( Math.floor( GAME.ms_Parameters.widthSegments / 2 + x ), Math.floor( GAME.ms_Parameters.heightSegments / 2 + z ) );
			
			if( y > 15.0 )
			{
				var aTree = new THREE.Mesh(  this.ms_Geometry, this.ms_Material );
				
				aTree.rotation.set( 0, RAND_MT.Random() * Math.PI * 2, 0 );
				
				aTree.position.x = x * GAME.ms_Parameters.width / GAME.ms_Parameters.widthSegments;
				aTree.position.y = y;
				aTree.position.z = z * GAME.ms_Parameters.height / GAME.ms_Parameters.heightSegments;
				
				var aScale = RAND_MT.Random() * 0.5 + 0.75;
				aTree.scale.set( aScale, aScale, aScale );
				
				THREE.GeometryUtils.merge( aTreeGeometry, aTree );
			}
		}
		
		var aFinalTrees = new THREE.Mesh( aTreeGeometry, this.ms_Material );
		this.ms_Trees.add( aFinalTrees );
		aFinalTrees.castShadow = true;
		aFinalTrees.receiveShadow = false;
	},
};

var GAME =
{
	ms_B2DWorld: null,
	ms_B2DShape: null,
	ms_Parameters: null,
	ms_HeightMap: null,
	ms_Clock: null,
	
	Initialize: function( inIdCanvas )
	{
		this.ms_HeightMap = TERRAINGEN.CreateCanvas( 0, 0 );
		this.ms_Parameters = {
			alea: RAND_MT,
			generator: PN_GENERATOR,
			width: 500,
			height: 2000,
			widthSegments: 50,
			heightSegments: 200,
			depth: 220,
			param: 3,
			filterparam: 1,
			filter: [ GAMETERRAIN_FILTER ],
			postgen: [ MOUNTAINS2_COLORS ],
			effect: [ DESTRUCTURE_EFFECT ],
			canvas: this.ms_HeightMap
		};
		this.ms_Clock = new THREE.Clock();
		
		CONV.ms_WorldRatio = GAME.ms_Parameters.height / GAME.ms_Parameters.heightSegments;
		CONV.ms_WorldOffsetZ = GAME.ms_Parameters.height * 0.5;
		CONV.ms_WorldOffsetY = GAME.ms_Parameters.depth * 0.10;
		CONV.ms_WorldOffsetX = GAME.ms_Parameters.width * 0.42;
	
		MESHES.Initialize();
		DISPLAY.Initialize( inIdCanvas );
		this.B2DInitialize( this.ms_Parameters );
		PLAYER.Initialize();
		GROUND.Initialize( this.ms_Parameters );
		TREES.Initialize();
	},
	
	B2DInitialize: function( inParameters )
	{	
		var aGravity = new Box2D.b2Vec2( 0.0, -3.0 );
		this.ms_B2DWorld = new Box2D.b2World( aGravity, true );
		
        var aEdgeShape = new Box2D.b2EdgeShape();
        aEdgeShape.Set( new Box2D.b2Vec2( 0, 0 ), new Box2D.b2Vec2( inParameters.heightSegments, 0 ) );
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
		
		var aSize = DISPLAY.ms_Animals.children.length * 0.8;
		for( var i = 0; i < aSize; ++i )
			DISPLAY.ms_Animals.children[i].lookAt( PLAYER.ms_Group.position );
			
		DISPLAY.Update( aDelta );
	},
	
	Jump: function()
	{
		PLAYER.Jump();
	},
};
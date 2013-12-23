function TerrainBlock( inIndex, inTerrain )
{
	this.trees = null;
	this.cows = new THREE.Object3D();
	this.obstacles = [];
	this.terrain = inTerrain;
	this.block = new THREE.Object3D();
	this.index = inIndex;
	
	this.block.add( this.terrain );
	this.block.add( this.cows );
}
var TREES =
{
	ms_Geometry: null,
	ms_Materiel: null,
	
	Initialize: function()
	{
		// Create pyramid
		var aMesh = new THREE.Mesh( new THREE.CylinderGeometry( 0, 4, 10, 4, 1 ), new THREE.MeshNormalMaterial() );
		aMesh.position.set( 0, 6, 0 );
		
		// Merge it width a deformed cube to make the bottom
		this.ms_Geometry = new THREE.CubeGeometry( 0.5, 2, 0.5, 1, 1, 1 );
		THREE.GeometryUtils.merge( this.ms_Geometry, aMesh );
		
		// Initialize the group of trees and material
		this.ms_Material = new THREE.MeshPhongMaterial( { color: 0x006600, ambient: 0x006600, shading: THREE.FlatShading } );
	},
	
	Generate: function( inParameters, inNbTrees, inPosition, inStep )
	{
		var aTreeGeometry = new THREE.Geometry();
		
		for( var i = 0; i < inNbTrees; ++i )
		{
			var x = ( 0.2 + RAND_MT.Random() * 0.7 ) * GAME.ms_Parameters.widthSegments - GAME.ms_Parameters.widthSegments / 2;
			var z = ( 0.01 + RAND_MT.Random() * 0.98 ) * inStep;
			var y = TERRAIN.GetDepth( Math.floor( GAME.ms_Parameters.widthSegments / 2 + x ), Math.floor( z + inPosition ) );
			
			if( y > 15.0 )
			{
				var aTree = new THREE.Mesh( this.ms_Geometry, this.ms_Material );
				
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
		aFinalTrees.castShadow = true;
		aFinalTrees.receiveShadow = false;
		return aFinalTrees;
	},
};

var ANIMALS =
{
	ms_Geometry: null,
	
	CallbackHelper: function( inBlock, inNbAnimals, inPosition, inStep )
	{
		return function( inGeometry )
		{
			ANIMALS.ms_Geometry = inGeometry;
			ANIMALS.GenerateAnimals( inBlock, inNbAnimals, inPosition, inStep );
		};
	},
	
	GenerateAnimals: function( inBlock, inNbAnimals, inPosition, inStep )
	{
		for( var i = 0; i < inNbAnimals; ++i )
		{
			var x = ( 0.2 + RAND_MT.Random() * 0.7 ) * GAME.ms_Parameters.widthSegments - GAME.ms_Parameters.widthSegments / 2;
			var z = ( 0.01 + RAND_MT.Random() * 0.98 ) * inStep;
			var y = TERRAIN.GetDepth( Math.floor( GAME.ms_Parameters.widthSegments / 2 + x ), Math.floor( z + inPosition ) );

			/*var x = ( 0.1 + RAND_MT.Random() * 0.9 ) * GAME.ms_Parameters.widthSegments/2 - GAME.ms_Parameters.widthSegments/8;
			var z = ( 0.005 + RAND_MT.Random() * 0.99 ) * GAME.ms_Parameters.heightSegments - GAME.ms_Parameters.heightSegments/2;
			var y = DISPLAY.GetDepth( Math.round( GAME.ms_Parameters.widthSegments / 2 + x ), Math.round( GAME.ms_Parameters.heightSegments / 2 + z ) );
			*/
			if( y > 15.0 )
			{
				var mesh = MESHES.AddMorph( this.ms_Geometry );
				mesh.position.x = x * GAME.ms_Parameters.width / GAME.ms_Parameters.widthSegments;
				mesh.position.y = y;
				mesh.position.z = z * GAME.ms_Parameters.height / GAME.ms_Parameters.heightSegments;
				mesh.rotation.set( 0, RAND_MT.Random() * Math.PI * 2, 0 );
				
				mesh.scale.set( 0.03, 0.03, 0.03 );
				mesh.castShadow = true;
				mesh.receiveShadow = false;
				
				inBlock.cows.add( mesh );
			}
		}
	},
	
	Generate: function( inBlock, inNbAnimals, inPosition, inStep )
	{
		if( this.ms_Geometry == null )
		{
			MESHES.Load( MESHES.Type.Cow, this.CallbackHelper( inBlock, inNbAnimals, inPosition, inStep ) );
		}
		else
		{
			this.GenerateAnimals( inBlock, inNbAnimals, inPosition, inStep );
		}
	}
};

var TERRAIN =
{
	ms_HeightMap: null,
	ms_Blocks: [],
	ms_Material: null,
	ms_Parameters: null,
	ms_Scene: null,
	ms_Step: 0,
	ms_LastPosition: 0,
	ms_TerrainSize: 0,
	ms_Iteration: 0,
	ms_MaxTerrains: 5,
	ms_NextStep: 0,
	
	Initialize: function( inScene, inParameters )
	{
		this.ms_Scene = inScene;
		this.ms_Parameters = inParameters;
		this.ms_Material = new THREE.MeshPhongMaterial( { vertexColors: THREE.VertexColors, shading: THREE.FlatShading, specular: 0xffffff, side: THREE.DoubleSide } );
		this.ms_HeightMap = TERRAINGEN.GetCanvas( inParameters );
		this.ms_Step = inParameters.step;
		this.ms_TerrainSize = inParameters.height * ( this.ms_Step ) / inParameters.heightSegments;
		this.ms_LastPosition = inParameters.heightSegments - this.ms_Step - 1;
		this.ms_NextStep = this.ms_TerrainSize * 3.0;
		
		TREES.Initialize();
		
		// Add two blocks of terrain at the beginning
		for( var i = 0; i < this.ms_MaxTerrains; ++i )
			this.Generate();
	},
	
	Generate: function()
	{
		if( this.ms_Blocks.length >= this.ms_MaxTerrains )
		{
			var aBlock = this.ms_Blocks.shift();
			this.ms_Scene.remove( aBlock.block );
			
			for( var i = 0; i < aBlock.cows.children.length; ++i )
			{
				MESHES.RemoveMorph( aBlock.cows.children[i] );
			}
		}
		
		var terrainGeo = TERRAINGEN.GetFromCanvas( this.ms_Parameters, this.ms_HeightMap, 0, this.ms_LastPosition, this.ms_Parameters.widthSegments, this.ms_Step );
		
		// Generate the terrain mesh and create the terrain block
		var aTerrain = new THREE.Mesh( terrainGeo, this.ms_Material );
		var aTerrainBlock = new TerrainBlock( this.ms_LastPosition, aTerrain );
		
		aTerrain.receiveShadow = true;
		aTerrain.castShadow = false;
		
		// Add it in the scene
		this.ms_Blocks.push( aTerrainBlock );
		aTerrainBlock.block.position.z = - ( this.ms_Iteration ) * this.ms_TerrainSize;
		this.ms_Scene.add( aTerrainBlock.block );
		
		// Generate trees
		aTerrainBlock.trees = TREES.Generate( this.ms_Parameters, 100, this.ms_LastPosition - this.ms_Step, this.ms_Step );
		aTerrainBlock.trees.position.z = - this.ms_TerrainSize * ( 0.5 + 0.5 / this.ms_Step );
		aTerrainBlock.block.add( aTerrainBlock.trees );
		
		// Generate cows
		ANIMALS.Generate( aTerrainBlock, 50, this.ms_LastPosition - this.ms_Step, this.ms_Step );
		aTerrainBlock.cows.position.z = - this.ms_TerrainSize * ( 0.5 + 0.5 / this.ms_Step );
		
		++ this.ms_Iteration;
		this.ms_LastPosition -= ( this.ms_Step - 1 );
		if( this.ms_LastPosition < 0 )
			this.ms_LastPosition = this.ms_Parameters.heightSegments - this.ms_Step - 1;
			
		return aTerrainBlock;
	},
	
	Update: function( inX )
	{
		if( -inX >= this.ms_NextStep )
		{
			this.Generate();
			this.ms_NextStep += this.ms_TerrainSize;
		}
	},
	
	GetDepth: function( inX, inY )
	{
		for( var i = 0; i < this.ms_Blocks.length; ++i )
		{
			var y = inY - this.ms_Blocks[i].index + this.ms_Step;
			if( y < this.ms_Step && y >= 0 )
			{
				return this.ms_Blocks[i].terrain.geometry.vertices[ y * GAME.ms_Parameters.widthSegments + inX ].y;
			}
		}
		return null;
	},
};
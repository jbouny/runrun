var MESHES =
{
	Type: { Cow:0, Elk:1, Fox:2, Parrot:3 },
	Names:[
		"assets/libs/obj/animals/cow.js",
		"assets/libs/obj/animals/elk.js",
		"assets/libs/obj/animals/fox.js",
		"assets/libs/obj/animals/parrot.js",
	],
	ms_MorphsGeometry: [],
	ms_Morphs: [],
	ms_Clock: null,
	ms_Loader: null,
	
	Initialize: function()
	{
		this.ms_Clock = new THREE.Clock();
		this.ms_Loader = new THREE.JSONLoader();
	},
	
	Load: function( inType, inCallback )
	{
		if( inType >= 0 && inType < this.Names.length )
		{
			this.ms_Loader.load( this.Names[inType], inCallback );
			return true;
		}
		return false;
	},
	
	AddMorph: function( inGeometry )
	{
		this.MorphColorsToFaceColors( inGeometry );
		var mesh = this.CreateMorph( inGeometry, 0.55, 600, 0, 0, 0, false );
		this.ms_Morphs.push( mesh );
		this.ms_MorphsGeometry.push( inGeometry );
		return mesh;
	},
	
	CreateMorph: function( inGeometry, inSpeed, inDuration, inX, inY, inZ, inFudgeColor ) 
	{
		var material = new THREE.MeshPhongMaterial( { color: 0xffffff, morphTargets: true, vertexColors: THREE.FaceColors, wrapAround: true, specular: 0xffffff } );

		if ( inFudgeColor )
			THREE.ColorUtils.adjustHSV( material.color, 0, 0.5 - Math.random(), 0.5 - Math.random() );

		var meshAnim = new THREE.MorphAnimMesh( inGeometry, material );

		meshAnim.speed = inSpeed;
		meshAnim.duration = inDuration;
		meshAnim.time = 1000 * Math.random();

		meshAnim.position.set( inX, inY, inZ );

		meshAnim.castShadow = true;
		meshAnim.receiveShadow = true;
		
		return meshAnim;
	},
	
	MorphColorsToFaceColors: function( inGeometry ) 
	{
		if ( inGeometry.morphColors && inGeometry.morphColors.length ) 
		{
			var colorMap = inGeometry.morphColors[ 0 ];
			
			for ( var i = 0; i < colorMap.colors.length; i ++ )
				inGeometry.faces[i].color = colorMap.colors[i];
		}
	},
	
	Update: function()
	{
		var delta = this.ms_Clock.getDelta();
		for ( var i = 0; i < this.ms_Morphs.length; i++ ) 
		{
			morph = this.ms_Morphs[i];
			morph.updateAnimation( 1000 * delta );
		}
	}
};
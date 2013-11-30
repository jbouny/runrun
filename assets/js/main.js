function MainLoop()
{
	requestAnimationFrame( MainLoop );
	GAME.Update();
}

$( function() {
	WINDOW.Initialize();
	GAME.Initialize( 'canvas-3d' );
	
	DISPLAY.Resize( WINDOW.ms_Width, WINDOW.ms_Height );
	
	MainLoop();
} );
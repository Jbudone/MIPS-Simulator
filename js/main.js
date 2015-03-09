define(['canvas'], function(Canvas){

	Keys.add(['STAGE_IF', 'STAGE_ID', 'STAGE_EX', 'STAGE_MEM', 'STAGE_WB']); // Instruction Pipeline/stages


	// Startup the canvas
	var canvas = new Canvas();

	// We can add components to the canvas here, the first argument will be the actual component object and
	// the 2nd is the stage which it belongs to. The stage may be helpful for highlighting components in an
	// active stage or something...or maybe not. The component itself should contain a uid property, this will
	// be useful for turning the canvas into an editor and moving the components around + saving their
	// positions rather than hardcoding those positions
	canvas.addComponent({ uid: 1 }, STAGE_IF);
	canvas.addComponent({ uid: 2 }, STAGE_ID);
	canvas.addComponent({ uid: 3 }, STAGE_EX);

});

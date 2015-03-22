define(['UI', 'canvas'], function(UI, Canvas){

	Keys.add(['STAGE_IF', 'STAGE_ID', 'STAGE_EX', 'STAGE_MEM', 'STAGE_WB']); // Instruction Pipeline/stages


	// MIPS specifications
	//
	// Following the O32 Calling Convention found here:
	// http://en.wikipedia.org/wiki/MIPS_instruction_set#Compiler_register_usage
	var Specifications = {
			registers: [
				'zero', // constant 0
				'at', // assembler temporary
				'v0', 'v1', // function return values
				'a0', 'a1', 'a2', 'a3', // function arguments
				't0', 't1', 't2', 't3', 't4', 't5', 't6', 't7', // temporaries
				's0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', // saved temporaries
				't8', 't9', // temporaries
				'k0', 'k1', // reserved for OS kernel
				'gp', 'sp', 'fp', // global/stack/frame pointer
				'ra' // return address
			],
		};



	// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% //
	//									User Experience Stuff
	// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% //

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


	// UI startup
	var UI = new UI();
	UI.initRegisters(Specifications.registers);

});

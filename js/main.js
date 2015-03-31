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


	$('#control-resume').click(function(){
		return false;
	});

	$('#control-step').click(function(){
		return false;
	});


	// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% //
	//									User Experience Stuff
	// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% //

	// Startup the canvas
	var canvas = new Canvas();


	// Just some placeholders to test out the canvas
	var placeholders = {
		components: [
			{ uid: 1 }, { uid: 2 }, { uid: 3 }
		], wires: []
	};
	placeholders.wires.push({
		input:  placeholders.components[0],
		output: placeholders.components[1],
		points: [{x:75, y:0}, {x:0, y:20}]
	});
	placeholders.wires.push({
		input:  placeholders.components[1],
		output: placeholders.components[2],
		points: [{x:180, y:0}]
	});
	placeholders.wires.push({
		input:  placeholders.components[2],
		output: placeholders.components[0],
		points: [{x:-350, y:0}]
	});


	// We can add components to the canvas here, the first argument will be the actual component object and
	// the 2nd is the stage which it belongs to. The stage may be helpful for highlighting components in an
	// active stage or something...or maybe not.
	canvas.addComponent(placeholders.components[0], STAGE_IF, { position: {x:50, y:80} });
	canvas.addComponent(placeholders.components[1], STAGE_ID, { position: {x:200, y:100}, dimensions: {width:50, height:60} });
	canvas.addComponent(placeholders.components[2], STAGE_EX, { position: {x:400, y:300} });

	// Wires should be able to add naturally based off the current Wire prototype
	canvas.addWire(placeholders.wires[0]);
	canvas.addWire(placeholders.wires[1]);
	canvas.addWire(placeholders.wires[2]);


	// UI startup
	var UI = new UI();
	UI.initRegisters(Specifications.registers);
	UI.loadMemory([], []); // reference to mips memoryText, memoryData here

	UI.onUserModifiedRegister = function(register, data){
		console.log("Changed register ("+register+") to: "+data);
	};

	UI.onUserModifiedMemory = function(address, data){
		console.log("Changed memory (0x"+address+") to: "+data);
	};

	UI.onUserAddedBreakpoint = function(lineno){
		console.log("User set a breakpoint at ["+lineno+"]");
	};

	UI.onUserClearedBreakpoint = function(lineno){
		console.log("User cleared the breakpoint at ["+lineno+"]");
	};

});

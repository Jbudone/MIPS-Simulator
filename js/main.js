define(['UI', 'canvas'], function(UI, Canvas){

	// TODO NOW!!
	// 	- run until exit
	// 	- debugger: show highlighted instruction
	// 	- show memory changes & register changes
	//
	// 	- reg/mem signed numbers
	//  - FIXME: Bits.unsigned(-1, 32)
	//  - FIXME: Bits.signed(7, 32).toInt()
	//  - TODO: make sure this works -- MIPS.registers[2].set(-1)
	//  - TODO: make sure we can set values in UI registers, and that they properly reflect the expected value in MIPS.registers
	//
	//  report planning
	//
	//  visual assets into canvas + wires
	//  adjust wires/points & positions to be relative & responsive
	//  

	Keys.add(['STAGE_IF', 'STAGE_ID', 'STAGE_EX', 'STAGE_MEM', 'STAGE_WB']); // Instruction Pipeline/stages



	$('#control-resume').click(function(){
		var code = UI.getCode();

		var address = 0;
		for (var i=0; i<code.length; ++i) {
			var word = code[i];
			MIPS.memory.icache.storeWord(address, word);
			address += 4;
		}


		MIPS.registers[2].set(4)
		MIPS.registers[1].set(12)

		var stepCode = function(){
			canvas.unhighlight();
			try {
				MIPS.execStage();
				console.log("Stepping code..");
				setTimeout( stepCode, 500 );
			} catch(e) {
				console.error(e);
				debugger;
			}
		};

		stepCode();
		
		return false;
	});

	var hasInitialized = false;
	$('#control-step').click(function(){

		if (!hasInitialized) {
			var code = UI.getCode();

			var address = 0;
			for (var i=0; i<code.length; ++i) {
				var word = code[i];
				MIPS.memory.icache.storeWord(address, word, 4);
				address += 4;
			}
		
			hasInitialized = true;
		} else {
			canvas.unhighlight();
			MIPS.execStage();
		}

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


	/*
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
	*/

	buildMIPS(canvas);

	// UI startup
	var UI = new UI();
	UI.initRegisters(MIPS.registers);
	UI.loadMemory(MIPS.memory.icache, MIPS.memory.dcache); // reference to mips memoryText, memoryData here
	window['UI'] = UI;

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

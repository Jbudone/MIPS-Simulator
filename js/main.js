define(['UI', 'canvas'], function(UI, Canvas){

	// TODO NOW!!
	// 	- run until exit
	// 	- debugger: show highlighted instruction
	// 	- show memory changes & register changes
	//
	//  report planning
	//
	//  visual assets into canvas + wires
	//  adjust wires/points & positions to be relative & responsive
	//  
	//  code snippets (load source + binary); should be commented so he knows what to look for; exit after a
	//  set number of steps; stop after choosing a new code snippet

	Keys.add(['STAGE_IF', 'STAGE_ID', 'STAGE_EX', 'STAGE_MEM', 'STAGE_WB']); // Instruction Pipeline/stages

	// Basic testing snippets source:
	// http://sites.fas.harvard.edu/~cscie287/fall2014/MIPS%20Coding%20Snippets.pdf
	var TESTING_MODE = {
		'none': null,
		'add': function(){
			MIPS.registers[2].set(4);
			MIPS.registers[1].set(12);
			UI.aceCode.getSession().setValue("00000000001000100001100000100000");
		}, 'addi': function(){

			// FIXME: $a1 = 4 but should = 17

			// addi $a1, $a0, 13
			MIPS.registers[MIPS.reg_names.indexOf('$a0')].set(4);
			UI.aceCode.getSession().setValue(" 00100000100001010000000000001101 ");
		}, 'addi_neg': function(){
			// FIXME: $a1 = 4 but should = -9

			// addi $a1, $a0, -13
			MIPS.registers[MIPS.reg_names.indexOf('$a0')].set(4);
			UI.aceCode.getSession().setValue(" 00100000100001011111111111110011 ");
		}, 'and': function(){

			// and $s3,$s1,$s2
			MIPS.registers[MIPS.reg_names.indexOf('$s1')].set(3);
			MIPS.registers[MIPS.reg_names.indexOf('$s2')].set(5);
			UI.aceCode.getSession().setValue(" 00000010001100101001100000100100 ");
		}, 'andi': function(){

			// andi $s2,$s1,5
			MIPS.registers[MIPS.reg_names.indexOf('$s1')].set(4);
			UI.aceCode.getSession().setValue(" 00110010001100100000000000000101 ");
		}, 'or': function(){

			// or $s3,$s1,$s2
			MIPS.registers[MIPS.reg_names.indexOf('$s1')].set(1);
			MIPS.registers[MIPS.reg_names.indexOf('$s2')].set(4);
			UI.aceCode.getSession().setValue(" 00000010001100101001100000100101 ");
		}, 'mult128': function(){
			// FIXME: supposed to set $t1 = $t0 * 128  ... instead does $t1 = $t0 * 1
			// sll $t1, $t0, 7
			MIPS.registers[MIPS.reg_names.indexOf('$t0')].set(4);
			UI.aceCode.getSession().setValue("00000000000010000100100111000000");
		}, 'mult': function(){
			// FIXME: supposed to set $t1 = $t0 * 4  ... instead does $t1 = $t0 * 1
			// sll $t1, $t0, 2
			MIPS.registers[MIPS.reg_names.indexOf('$t0')].set(4);
			UI.aceCode.getSession().setValue("00000000000010000100100010000000");
		}, 'sw': function(){
			// FIXME: sets dcache[$s1] = $s1 ... should be dcache[0] = $s1
			// sw $s1, 0($zero)
			MIPS.registers[MIPS.reg_names.indexOf('$s1')].set(42);
			UI.aceCode.getSession().setValue(" 10101100000100010000000000000000 ");
		}, 'lui': function(){
			// FIXME: sets $s1 = 1, should be 2^16
			// lui $s1,1
			MIPS.registers[MIPS.reg_names.indexOf('$s1')].set(1);
			UI.aceCode.getSession().setValue(" 00111100000100010000000000000001 ");
		}, 'exponent': function(){

			// FIXME: running this triggers component.js:31 exception (value undefined)

			// Subroutine: exp
			// Description: computes $a0 raised to the $a1 power by simple looping
			// Parameters: $a0 is the base
			// $a1 is the exponent
			// Results: $v0 will be $a0 ^ $a1
			// Side effects: $a1, HI, LO, and $ra will be overwritten

			/*
			 exp:
			 		$v0, $0, 1 # initial result is 1
			 		beq $a1, $0, expZero # loop is over, exponent is now zero
			 expLoop:
			 		mult $v0, $a0 # (HI concat LO) <- running product * base
			 		mflo $v0 # update the running product
			 		addi $a1, $a1, -1 # decrement the exponent
			 		bne $a1, $0, expLoop
			 expZero:
			 		jr $ra
			*/

			MIPS.registers[MIPS.reg_names.indexOf('$a0')].set(2);
			MIPS.registers[MIPS.reg_names.indexOf('$a1')].set(3);
			UI.aceCode.getSession().setValue("	00110100000000100000000000000001 \
												00010000101000000000000000000100 \
												00000000010001000000000000011000 \
												00000000000000000001000000010010 \
												00100000101001011111111111111111 \
												00010100101000001111111111111100 \
												00000011111000000000000000001000 \
											");
		},
	}['lui'];

	


	$('#control-resume').click(function(){

		if (TESTING_MODE) {
			TESTING_MODE();
		}

		var code = UI.getCode(),
			address = 0;
		for (var i=0; i<code.length; ++i) {
			var word = code[i];
			MIPS.memory.icache.storeWord(address, word);
			address += 4;
		}


		var stepCode = function(){
			canvas.unhighlight();
			// try {
				MIPS.execStage();
				console.log("Stepping code..");
				setTimeout( stepCode, 500 );
			// } catch(e) {
			// 	console.error(e);
			// 	debugger;
			// }
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
	canvas.addComponent(placeholders.components[1], STAGE_ID, { position: {x:200, y:100}, dimensions: {width:50, height:60}, asset: { id: 'placeholder', 'file': 'smiley-face.jpg' } });
						
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

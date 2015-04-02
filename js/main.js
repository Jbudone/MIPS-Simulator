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


	var nextRun = null;
	var reset = function(){

		if (nextRun) clearTimeout(nextRun);
		for (var i=0; i<MIPS.memory.icache.cache.length; ++i) {
			if (MIPS.memory.icache.cache[i]) {
				MIPS.memory.icache.cache[i] = 0;
			}
		}
		for (var i=0; i<MIPS.memory.dcache.cache.length; ++i) {
			if (MIPS.memory.dcache.cache[i]) {
				MIPS.memory.dcache.cache[i] = 0;
			}
		}
		for (var i=0; i<MIPS.reg_names.length; ++i) {
			MIPS.registers[i].set(0);
		}
		MIPS.registers['HI'].set(0);
		MIPS.registers['LO'].set(0);

		MIPS.queue.queue = new Array();
		MIPS.queue.insert( pc );
		MIPS.queue.insert( ifid );
		MIPS.queue.insert( idex );
		MIPS.queue.insert( exmem );
		MIPS.queue.insert( memwb );

		for (var i=0; i<pc.inputs.length; ++i) {
			pc.inputs[i].setValue(0, pc.inputs[i].bits);
		}
	};

	// Snippets of code
	var preRun = null;
	var addSnippet = function(snippet){

		var _snippetLink = $('<a/>').addClass('snippet-link').text(snippet.name).click(function(){

			// reset();

			var snippet = $(this).data('snippet');
			UI.aceMIPS.getSession().setValue( snippet.mips );
			UI.aceCode.getSession().setValue( snippet.code );
			
			if (snippet.preRun) snippet.preRun();
			preRun = snippet.preRun;
			$('#tabs [aria-controls="editor-container"]').tab('show');

			return false;
		}).data('snippet', snippet);
		var _snippetDesc = $('<span/>').addClass('snippet-desc').text(snippet.description);
		var _snippetEl = $('<div/>').addClass('snippet-container').append( _snippetDesc ).append( _snippetLink );

		$('#snippets').append( _snippetEl );

	};

	
	// Basic testing snippets source:
	// http://sites.fas.harvard.edu/~cscie287/fall2014/MIPS%20Coding%20Snippets.pdf
	addSnippet({
		name: "Add",
		description: "Add two registers: ",
		mips: "addi $at, $zero, 12 \naddi $v0, $zero, 4 \nadd $v1, $at, $v0",
		code: "00000000001000100001100000100000",
		preRun: function(){
			MIPS.registers[2].set(4);
			MIPS.registers[1].set(12);
		}
	});

	addSnippet({
		name: "Add Immediate",
		description: "Add immediate value to register: ",
		mips: "addi $a0, $zero, 4 \naddi $a1, $a0, 13",
		code: "00100000100001010000000000001101",
		preRun: function(){
			MIPS.registers[MIPS.reg_names.indexOf('$a0')].set(4);
		}
	});

	addSnippet({
		name: "Add Immediate (negative)",
		description: "Add immediate negative value to register: ",
		mips: "addi $a0, $zero, 4\naddi $a1, $a0, -13",
		code: "00100000100001011111111111110011",
		preRun: function(){
			MIPS.registers[MIPS.reg_names.indexOf('$a0')].set(4);
		}
	});

	addSnippet({
		name: "And",
		description: "And two registers: ",
		mips: "addi $s1, $zero, 3\naddi $s2, $zero, 5\nand $s3, $s1, $s2",
		code: "00000010001100101001100000100100",
		preRun: function(){
			MIPS.registers[MIPS.reg_names.indexOf('$s1')].set(3);
			MIPS.registers[MIPS.reg_names.indexOf('$s2')].set(5);
		}
	});

	addSnippet({
		name: "And Immediate",
		description: "And an immediate value: ",
		mips: "addi $s1, $zero, 4\nandi $s2, $s1, 5",
		code: "00110010001100100000000000000101",
		preRun: function(){
			MIPS.registers[MIPS.reg_names.indexOf('$s1')].set(4);
		}
	});

	addSnippet({
		name: "Or",
		description: "Or two registers: ",
		mips: "addi $s1, $zero, 1\naddi $s2, $zero, 4\nor $s3, $s1, $s2",
		code: "00000010001100101001100000100101",
		preRun: function(){
			MIPS.registers[MIPS.reg_names.indexOf('$s1')].set(1);
			MIPS.registers[MIPS.reg_names.indexOf('$s2')].set(4);
		}
	});

	addSnippet({
		name: "Multiply 128",
		description: "Multiply a register: ",
		mips: "addi $t0, $zero, 4\nsll $t1, $t0, 7",
		code: "00000000000010000100100111000000",
		preRun: function(){
			MIPS.registers[MIPS.reg_names.indexOf('$t0')].set(4);
		}
	});

	addSnippet({
		name: "Multiply 4",
		description: "Multiply a register: ",
		mips: "addi $t0, $zero, 4\nsll $t1, $t0, 2",
		code: "00000000000010000100100010000000",
		preRun: function(){
			MIPS.registers[MIPS.reg_names.indexOf('$t0')].set(4);
		}
	});

	addSnippet({
		name: "Store Word",
		description: "Store a word into memory: ",
		mips: "addi $s1, $zero, 42\nsw $s1, 0($zero)",
		code: "10101100000100010000000000000000",
		preRun: function(){
			MIPS.registers[MIPS.reg_names.indexOf('$s1')].set(42);
		}
	});

	addSnippet({
		name: "Set Short",
		description: "Set $s1 = 2^16: ",
		mips: "addi $s1, $zero, 1\nlui $s1, 1",
		code: "00111100000100010000000000010000",
		preRun: function(){
			MIPS.registers[MIPS.reg_names.indexOf('$s1')].set(1);
		}
	});

	/*
	addSnippet({
		name: "Exponent",
		description: "Take the exponent of a number: ",
		mips: "\
\n# Subroutine: exp\
\n# Description: computes $a0 raised to the $a1 power by simple looping\
\n# Parameters: $a0 is the base\
\n# $a1 is the exponent\
\n# Results: $v0 will be $a0 ^ $a1\
\n# Side effects: $a1, HI, LO, and $ra will be overwritten\
\n\
\naddi $a0, $zero, 2\
\naddi $a1, $zero, 3\
\n		 exp:\
\n		 		add $v0, $zero, 1 # initial result is 1\
\n		 		beq $a1, $zero, expZero # loop is over, exponent is now zero\
\n		 expLoop:\
\n		 		mult $v0, $a0 # (HI concat LO) <- running product * base\
\n		 		mflo $v0 # update the running product\
\n		 		addi $a1, $a1, -1 # decrement the exponent\
\n		 		bne $a1, $0, expLoop\
\n		 expZero:",
		code: "\
\n00100000000001000000000000000010\
\n00100000000001010000000000000011\
\n00100000000000100000000000000001\
\n00000000000000000000000000000000\
\n00000000000000000000000000000000\
\n00000000000000000000000000000000\
\n00000000000000000000000000000000\
\n00000000000000000000000000000000\
\n00010000101000000000000000001100\
\n00000000010001000000000000011000\
\n00000000000000000000000000000000\
\n00000000000000000000000000000000\
\n00000000000000000000000000000000\
\n00000000000000000000000000000000\
\n00000000000000000001000000010010\
\n00100000101001011111111111111111\
\n00000000000000000000000000000000\
\n00000000000000000000000000000000\
\n00000000000000000000000000000000\
\n00000000000000000000000000000000\
\n00010100101000001111111111110100",
		preRun: function(){
			MIPS.registers[MIPS.reg_names.indexOf('$a0')].set(2);
			MIPS.registers[MIPS.reg_names.indexOf('$a1')].set(3);
		}
	});
	*/

	$('#control-resume').click(function(){

		if (nextRun || hasInitialized) {
			// Omg! We're already running
			alert("Oops! It looks like you already have a process running.. try refreshing the page to running from scratch");
			return false;
			// reset();
		}

		if (preRun) preRun();

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
				nextRun = setTimeout( stepCode, 500 );
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

		if (nextRun) {
			// Omg! We're already running
			alert("Oops! It looks like you already have a process running.. try refreshing the page to running from scratch");
			return false;
			// reset();
		}

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

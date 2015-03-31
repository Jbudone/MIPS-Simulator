
/**
 * The Wire class represents a simple wired connection between components.
 */
function Wire(output, input, bits, points) {
	if (!output.indexOf) { output = [output, 0]; }
	if (!input.indexOf) { input = [input, 0]; }
	
	this.points = points || [];
	this.bits = bits || 32;
	this.output = output[0];
	this.output.outputs[output[1]] = this;
	this.output.outStore[output[1]] = new Bits(Bits.kZero64.slice(0, 32));
	this.input = input[0];
	this.input.inputs[input[1]] = this;
	this.input.inStore[input[1]] = new Bits(Bits.kZero64.slice(0, 32));
	this.value = new Bits();
	this.changed = false;
}

Wire.prototype = {
	constructor: Wire,

	putInputOnQueue: function() {
		if (this.input.type !== Component.Type.Immediate &&
			 this.input.hasAllInputs()) {
			MIPS.queue.insert(this.input);
		}
	},

	setValue: function(value) {
		this.value = value;
		if (this.input.type == Component.Type.Immediate) {
			for (var i = 0; i < this.input.outputs.length; ++i) {
				this.input.readInput();
				this.input.execute();
				this.input.writeOutput();
			}
		}
		this.changed = true;
		this.hasChanged();
	},

	read: function() {
		this.changed = false;
		return this.value;
	},
		
	hasChanged: new Function()
};

Wire.connect = function(output, input, bits, points) {
	return new Wire(output, input, bits, points);
};

Wire.connect64 = function(output, input, points) {
	return new Wire(output, input, 64, points);
};

Wire.connect32 = function(output, input, points) {
	return new Wire(output, input, 32, points);
};

Wire.connect16 = function(output, input, points) {
	return new Wire(output, input, 16, points);
};

Wire.connectConst32 = function(value, input, points) {
	value = Bits.str(value);
	var wire = new Wire(new Component(), input, 32, points);
	wire.setValue(new Bits(value));
	return wire;
};

/** 
 * The base component class.
 */
function Component() {
	this.initialise();
}

Component.Type = {kNormal: 0, kImmediate: 1, kComposite: 2};

Component.prototype = {
	constructor: Component,

	/**
	 * Method to initialise the component in the constructor. 
	 */
	initialise: function(priority) {
		this.inputs = [];
		this.outputs = [];
		this.inStore = [];
		this.outStore = [];
		this.priority = priority || 0;
		this.type = Component.Type.kNormal;
		this.queued = false;
	},

	/**
	 * Default execute method just does pass-through from inputs to outputs.
	 */
	execute: function() {
		for (var i = 0; i < this.inStore.length; ++i) {
			this.outStore[i] = this.inStore[i];
		}
	},

	/**
	 * Method to read the inputs from the wires connected to the
	 * component.
	 */
	readInput: function() {
		for (var i = 0; i < this.inputs.length; ++i) {
			this.inStore[i] = this.inputs[i].read(); 
		}
	},

	/**
	 * Method to write the outputs to the output wires.
	 */
	writeOutput: function() {
		for (var i = 0; i < this.outputs.length; ++i) {
			this.outputs[i].setValue(this.outStore[i]);
			this.outputs[i].putInputOnQueue();
		}
	},

	/* Method to see if has all inputs */
	hasAllInputs: function() {
		var hasAll = true;
		for (var i = 0; i < this.inputs.length; ++i) {
			hasAll = hasAll && this.inputs[i].changed;
		}
		return hasAll;
	}
};

function PipelineReg() {
	this.initialise();
}

/**
 * The CompositeCmp represents a component build from multiple
 * components (e.g., pipeline registers) that just copies 
 * the inputs to the components internal inputs and puts 
 * them on the queue in the output stage.
 */
PipelineReg.prototype = {
	constructor: PipelineReg,

	/**
	 * Method to initialise the component in the constructor. 
	 */
	initialise: function(priority) {
		this.ctrl = new Component(priority);
		this.data = new Component(0);
		this.priority = priority || 0;
		this.type = Component.Type.kComposite;
		this.queued = false;
	},

	/** Does nothing */
	execute: function() 	{},

	/**
	 * Method to read the inputs from the wires connected to the
	 * component.
	 */
	readInput: function() {
		/* Read the inputs for the control component */
		this.ctrl.readInput();
		/* Read the inputs for the data component */
		this.data.readInput();
	},

	/**
	 * Method to write the outputs to the output wires.
	 */
	writeOutput: function() {
		MIPS.queue.insert(this.ctrl);
		MIPS.queue.insert(this.data);
	},

	/* Method to see if has all inputs */
	hasAllInputs: function() {
		return this.ctrl.hasAllInputs() && this.data.hasAllInputs();
	}
};

// ######################################
// ## AND GATE
// ######################################
function ANDGate(priority) { this.initialise(priority); }
ANDGate.prototype = new Component();
ANDGate.prototype.constructor = ANDGate;
ANDGate.prototype.execute = function() {
	var in0 = this.inStore[0].toInt();
	var in1 = this.inStore[1].toInt();
	var result = in0 & in1;
	this.outStore[0] = Bits.bit(result);
};

// ######################################
// ## THE MUX
// ######################################
function Mux(priority) { this.initialise(priority); }
Mux.prototype = new Component();
Mux.prototype.constructor = Mux;
Mux.prototype.execute = function() {
	var select = this.inStore[0].toInt();
	this.outStore[0] = this.inStore[select + 1];
};

// #######################################
// ## THE MAIN ALU
// #######################################
function ALU(priority) { this.initialise(priority); }


ALU.prototype = new Component();
ALU.In = {kIn0: 0, kIn1: 1, kALUCtrl: 2};
ALU.Out = {kZero: 0, kResult: 1};
ALU.Op = {
	kAdd:  '00000', kAddu:  '00001', kSub: '00010', kSubu: '00011',
	kOr:   '00101', kNor:   '00111', kXor: '00110', kAnd:  '00100',
	kMult: '01000', kMultu: '01001', kDiv: '01010', kDivu: '01011',
	kSlt:  '01101',
	kSll:  '01100', kSrl:   '01110', kSra: '01111'
};
ALU.fn = {};
/* The inputs for these functions are numbers */
ALU.fn[ALU.Op.kAdd] = ALU.fn[ALU.Op.kAddu] = function(a,b) { return a + b; };
ALU.fn[ALU.Op.kSub] = ALU.fn[ALU.Op.kSubu] = function(a,b) { return a - b; };
ALU.fn[ALU.Op.kOr] = function(a,b) { return a | b; };
ALU.fn[ALU.Op.kNor] = function(a,b) { return ~(a | b); };
ALU.fn[ALU.Op.kXor] = function(a,b) { return  a ^ b; };
ALU.fn[ALU.Op.kAnd] = function(a,b) { return a & b; };
ALU.fn[ALU.Op.kMult] = ALU.fn[ALU.Op.kMultu] = function(a,b) { return a * b; };
ALU.fn[ALU.Op.kDiv] = ALU.fn[ALU.Op.kDivu] = function(a,b) { return a / b; };
ALU.fn[ALU.Op.kSlt] = function(a,b) { return (a < b) ? 1 : 0; };

/* 'a' is a Bits object, 'b' is a number */
ALU.fn[ALU.Op.kSll] = function(a,b) { return a.shiftLeft(b); };
ALU.fn[ALU.Op.kSrl] = function(a,b) { return a.shiftRight(b); };
ALU.fn[ALU.Op.kSra] = function(a,b) { return a.shiftRightArithmetic(b); };

ALU.Src0 = { kRs: '00', kR0: '01', kLo: '10', kHi: '11' };
ALU.Src1 = { kRt: '00', kR0: '01', kImmediate: '10', kPCPlus4: '11' }; 

ALU.prototype.constructor = ALU;
ALU.prototype.execute = function() {
	var ctrl = this.inStore[ALU.In.kALUCtrl].s;
	var neg = parseInt(ctrl[0], 2);
	ctrl = '0' + ctrl.splice(1);
	
	this.inStore[ALU.In.kIn0].type = Bits.kSigned;
	this.inStore[ALU.In.kIn1].type = Bits.kSigned;
	if ((ctrl != ALU.Op.kSlt && ctrl[1] == '1' && (ctrl[4] == '1' || ctrl[2] == '1')) ||
		 (ctrl.splice(0, 3) == '001')) {
		this.inStore[ALU.In.kIn0].type = Bits.kUnsigned;
		this.inStore[ALU.In.kIn1].type = Bits.kUnsigned;
	}
	
	var in0 = this.inStore[ALU.In.kIn0].toInt();
	var in1 = this.inStore[ALU.In.kIn1].toInt();
	
	if (ctrl != ALU.Op.kSlt && ctrl.splice(0,3) == '011') { /* shifts */
		in0 = this.inStore[ALU.In.kIn0];
	}
	var result = ALU.fn[ctrl](in0, in1);

	this.outStore[ALU.Out.kZero] = Bits.bit(result == neg);
	this.outStore[ALU.Out.kResult] = Bits.signed(result, 64);
};


// #######################################
// ## A 32 BIT ADDER
// #######################################
function Adder32(priority) { this.initialise(priority); }
Adder32.prototype = new Component();
Adder32.prototype.constructor = Adder32;
Adder32.prototype.execute = function() {
	var in0 = this.inStore[0].toInt();
	var in1 = this.inStore[1].toInt();
	var result = in0 + in1;
	this.outStore[0] = Bits.unsigned(result, 32);
};

// #######################################
// ## An Adder to add 4 to a 32 bit number
// #######################################
function Adder4_32(priority) { this.initialise(priority); }
Adder4_32.prototype = new Component();
Adder4_32.prototype.constructor = Adder4_32;
Adder4_32.prototype.execute = function() {
	var in0 = this.inStore[0].toInt();
	var result = in0 + 4;
	this.outStore[0] = Bits.unsigned(result, 32);
};

// #######################################
// ## Shift a 32 bit value left by 2
// #######################################
function ShiftLeft2_32(priority) { this.initialise(priority); }
ShiftLeft2_32.prototype = new Component();
ShiftLeft2_32.prototype.constructor = ShiftLeft2_32;
ShiftLeft2_32.prototype.execute = function() {
	this.outStore[0] = this.inStore[0].shiftLeft(2);
};

// #######################################
// ## Shift a 26 bit value left by 2 to get a 28 bit value.
// #######################################
function ShiftLeft2_26(priority) { this.initialise(priority); }
ShiftLeft2_26.prototype = new Component();
ShiftLeft2_26.prototype.constructor = ShiftLeft2_26;
ShiftLeft2_26.prototype.execute = function() {
	this.outStore[0] = Bits.splice(this.inStore[0], '00');
};

// #######################################
// ## Extend bit number to 32 bits
// #######################################
function Ext32(priority) { this.initialise(priority); }
Ext32.prototype = new Component();
Ext32.prototype.constructor = Ext32;
Ext32.In = {kInput: 0, kCtrl: 1};
Ext32.prototype.execute = function() {
	var ctrl = this.inStore[Ext32.In.kCtrl].toInt();
	var lower, upper;
	if (ctrl) { /* Extending shift amount */
		lower = this.inStore[Ext32.In.kInput].bits(6, 10).s;
		upper = Bits.Zero64.slice(0, 27);
	}
	else { /* Sign extending the immediate value */
		lower = this.inStore[Ext32.In.kInput].s;
		upper = (this.inStore[0][0] == '1') ? Bits.One64.slice(0, 16) : Bits.Zero64.slice(0, 16);
	}
	this.outStore[0] = Bits.splice(upper, this.inStore[0]);
};

// ######################################
// ## PROGRAM COUNTER (PC)
// ######################################
function PC(priority) {
	this.initialise(priority);
	this.outStore[0] = Bits.kZero64.slice(0, 32);
}
PC.In = {kPCWrite: 0, kAddr: 1};
PC.prototype = new Component();
PC.prototype.constructor = PC;
PC.prototype.execute = function() {
	var signal = this.inStore[PC.In.kPCWrite].toInt();
	if (signal) {
		this.outStore[0] = this.inStore[PC.In.kAddr];
	}
};

// #####################################
// ## THE INSTRUCTION MEMORY
// #####################################
function IMem(priority) { this.initialise(priority); }
IMem.prototype = new Component();
IMem.prototype.constructor = IMem;
IMem.prototype.execute = function() {
	/* Todo: Fetch instruction from global memory object */
	var instr = MIPS.memory.icache.loadWord(this.inStore[0]);
	this.outStore[0] = instr;
};

// #####################################
// ## DATA MEMORY
// #####################################
function DMem(priority) { this.initialise(priority); }
DMem.In = {kMemWrite: 0, kMemCtrl: 1, kAddr: 2, kWriteData: 3};
DMem.Out = {kReadData: 0};
DMem.prototype = new Component();
DMem.prototype.constructor = DMem;
DMem.prototype.execute = function() {
	/* Read */
	var writeCtrl = this.inStore[DMem.In.kMemCtrl];
	var w_size = writeCtrl.s.slice(1);
	var addr = this.inStore[DMem.In.kAddr];
	var bytes = 4;
	if (w_size == '01') { bytes = 1; }
	else if (writeCtrl == '10') { bytes = 2; }
	this.outStore[0] = MIPS.memory.dcache.load(addr, bytes);
	if (writeCtrl.s[0] == '1') { /* Load upper */
		this.outStore[0] = this.outStore[0].shiftLeft((4 - bytes) * 8);
	}

	/* Write if needed */
	var write = this.inStore[DMem.In.kMemWrite];
	if (write.notZero()) {
		MIPS.memory.dcache.storeWord(addr, this.inStore[DMem.In.kWriteData], bytes);
	}
};

// #####################################
// ## THE REGISTER FILE
// #####################################
function Reg(priority) { this.initialise(priority); }
Reg.In = {kRegWrite: 0, kReadReg0: 1, kReadReg1: 2,
			 kWriteReg: 3, kWriteData: 4};
Reg.Out = {kReg0: 0, kReg1: 1, kHi: 2, kLo: 3};
Reg.prototype = new Component();
Reg.prototype.constructor = Reg;
Reg.prototype.execute = function() {
	/* Read from the registers */
	var r1 = this.inStore[Reg.In.kReadReg0].toInt();
	var r2 = this.inStore[Reg.In.kReadReg1].toInt();
	this.outStore[Reg.Out.kReg0] = new Bits(MIPS.registers[r1]);
	this.outStore[Reg.Out.kReg1] = new Bits(MIPS.registers[r2]);
	this.outStore[Reg.Out.kHi] = new Bits(MIPS.registers.HI);
	this.outStore[Reg.Out.kLo] = new Bits(MIPS.registers.LO);

	/* Write to the write register if need to */
	var regWrite = this.inStore[Reg.In.kRegWrite];
	if (regWrite.notZero()) {
		var data = this.inStore[Reg.In.kWriteData];
		if (regWrite.s == '10') {
			/* Write to the hi and low registers */
			MIPS.registers.HI.set(data.bits(32, 63));
			MIPS.registers.LO.set(data.bits(0, 31));
		}
		else {
			var wr = this.inStore[Reg.In.kWriteReg].toInt();
			MIPS.registers[wr].set(data.bits(0, 31));
		}
	}
};

// ######################################
// ## THE MAIN CONTROL UNIT
// ######################################
function Ctrl(priority) {

}
Ctrl.kRegWrite = 0;
Ctrl.kMemToReg = 1;
Ctrl.kMemWrite = 2;
Ctrl.kMemCtrl = 3;
Ctrl.kBranch = 4;
Ctrl.kALUCtrl = 5;
Ctrl.kALUSrc0 = 6;
Ctrl.kALUSrc1 = 7;
Ctrl.kRegDest = 8;
Ctrl.kJump = 9;
Ctrl.kJumpR = 10;
Ctrl.kExtendCtrl = 11;

Ctrl.In = {kOpcode: 0, kFunct: 1};

Ctrl.prototype = new Component();
Ctrl.prototype.constructor = Ctrl;
Ctrl.prototype.resetSignals = function() {
	this.outStore[Ctrl.kRegWrite].s = '00';
	this.outStore[Ctrl.kMemToReg].s = '0';
	this.outStore[Ctrl.kMemWrite].s = '0';
	this.outStore[Ctrl.kMemCtrl].s = '000';
	this.outStore[Ctrl.kALUCtrl].s = '00000';
	this.outStore[Ctrl.kALUSrc0].s = '00';
	this.outStore[Ctrl.kALUSrc1].s = '00';
	this.outStore[Ctrl.kRegDest].s = '00';
	this.outStore[Ctrl.kBranch].s = '0';
	this.outStore[Ctrl.kJump].s = '0';
	this.outStore[Ctrl.kJumpR].s = '0';
	this.outStore[Ctrl.kExtendCtrl].s = '0';
};
Ctrl.prototype.processRType = function(funct) {
	this.outStore[Ctrl.kRegWrite].s = '01';
	this.outStore[Ctrl.kRegDest].s = '01';
	if (funct == '001000') { /* Jump register */
		this.outStore[Ctrl.kRegWrite].s = '00';
		this.outStore[Ctrl.kJumpR].s = '1';
		this.outStore[Ctrl.kALUSrc1].s = ALU.Src1.kR0;
	}
	else if (funct == '101010') { /* Set on less than */
		this.outStore[Ctrl.kALUCtrl].s = ALU.Op.kSlt;
	}
	else if (funct[0] == '1') { /* add, sub, logic */
		this.outStore[Ctrl.kALUCtrl].s = funct.splice(1);
	}
	else if (funct[1] == '1') { /* Mult, div or move from hi/low */
		if (funct[2] == '1') { /* Mult or Div */
			this.outStore[Ctrl.kRegWrite].s = '10';
			this.outStore[Ctrl.kRegDest].s = '11';
			this.outStore[Ctrl.kALUCtrl].s = '0' + funct.splice(2);
		}
		else { /* Move from hi or low */
			this.outStore[Ctrl.kALUSrc1].s = ALU.Src1.kR0;
			if (funct[4] == '0') { /* move from hi */
				this.outStore[Ctrl.kALUSrc0].s = ALU.Src0.kHi;
			}
			else { /* Move from low */
				this.outStore[Ctrl.kALUSrc0].s = ALU.Src0.kLo;
			}
		}
	}
	else { /* Shifts */
		this.outStore[Ctrl.kALUCtrl].s = '011' + funct.splice(3);
		if (funct[3] == '0') { /* immediate (use shift amt) */
			this.outStore[Ctrl.kExtendCtrl].s = '1';
		}
	}
	
};
Ctrl.prototype.execute = function() {
	this.resetSignals();
	var opcode = this.inStore[0].s;

	if (opcode[0] == '1') { /* load or store */
		if (opcode[5] == '0') { /* byte */
			this.outStore[Ctrl.kMemCtrl].s = '001';
		}
		else { /* Half or word */
			this.outStore[Ctrl.kMemCtrl].s = '01' + opcode[4];
		}
		this.outStore[Ctrl.kALUSrc1].s = ALU.Src1.kImmediate;
		this.outStore[Ctrl.kMemWrite].s = opcode[2];
		if (opcode[2] == '0') { /* load */
			this.outStore[Ctrl.kMemCtrl].s[0] = opcode[3];
			this.outStore[Ctrl.kMemToReg].s = '1';
			this.outStore[Ctrl.kRegWrite].s = '01';
		}
	}
	else if (opcode[2] == '1') { /* Immediate */
		this.outStore[Ctrl.kRegWrite].s = '01';
		this.outStore[Ctrl.kALUSrc1].s = ALU.Src1.kImmediate;
		if (opcode == '001111') { /* Load upper immediate */
			this.outStore[Ctrl.kALUSrc0].s = ALU.Src0.kR0;
		}
		else if (opcode[3] == '1') { /* andi, ori */
			if (opcode[5] == '0') { /* ori */
				this.outStore[Ctrl.kALUCtrl].s = ALU.Op.kOr;
			}
			else { /* andi */
				this.outStore[Ctrl.kALUCtrl].s = ALU.Op.kAnd;
			}
		}
		else if (opcode[4] == '1') { /* set-on-less-than immediate */
			this.outStore[Ctrl.kALUOp].s = ALU.Op.kSlt;
		}
		else if (opcode[5] == '0') { /* addi */
			this.outStore[Ctrl.kALUOp].s = ALU.Op.kAddu;
		}
	}
	else if (opcode[3] == '1') { /* Branch */
		this.outStore[Ctrl.kBranch].s = '1';
		this.outStore[Ctrl.kALUCtrl].s = opcode[5] + ALU.Op.kSub.slice(1);
	}
	else if (opcode[4] == '1') { /* Jump */
		this.outStore[Ctrl.kJump] = '1';
		if  (opcode[5] == '1') { /* Jump and link */
			this.outStore[Ctrl.kWriteReg].s = '01';
			this.outStore[Ctrl.kRegDest].s = '10';
			this.outStore[Ctrl.kALUSrc0].s = ALU.Src0.kR0;
			this.outStore[Ctrl.kALUSrc1].s = ALU.Src1.kPCPlus4;
		}
	}
	else { /* R type */
		this.processRType(this.inStore[1].s);
	}
};

// #######################################
// ## Dup is a pass-through component that copies the input signal
// ## To two or more outputs.
// #######################################
function Dup(priority) {
	this.initialise(priority);
	this.type = Component.Type.Immediate;
}
Dup.prototype = new Component();
Dup.prototype.constructor = Dup;
Dup.prototype.execute = function() {
	var input = this.inStore[0];
	for (var i = 0; i < this.outputs.length; ++i) {
		this.outStore[i] = input;
	}
};

// #######################################
// ## Splitter is a pass-through component that copies
// ## part or all of the input signal to multiple outputs.
// #######################################
function Splitter(priority, bitRanges) {
	this.initialise(priority);
	this.type = Component.Type.Immediate;
	this.outputRanges = bitRanges;
}
Splitter.prototype = new Component();
Splitter.prototype.constructor = Splitter;
Splitter.prototype.execute = function() {
	var input = this.inStore[0];
	for (var i = 0; i < this.outputs.length; ++i) {
		this.outStore[i] = input.bits(this.outputRanges[i][0], this.outputRanges[i][1]);
	}
};

// #######################################
// ## Splicer is a pass-through component that merges
// ## multiple inputs into a single output.
// #######################################
function Splicer(priority) {
	this.initialise(priority);
	this.type = Component.Type.Immediate;
}
Splicer.prototype = new Component();
Splicer.prototype.constructor = Splicer;
Splicer.prototype.execute = function() {
	var result = this.inStore[0];
	for (var i = 1; i < this.inStore[0].length; ++i) {
		result = Bits.splice(result, this.inStore[i]);
	}
	this.outStore[0] = result;
};

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$ THE IF_ID PIPELINE REGISTER
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
function IF_ID(priority) { this.initialise(priority); }
IF_ID.D = {kPCPlus4: 0, kInstr: 1};
IF_ID.prototype = new PipelineReg();
IF_ID.prototype.constructor = IF_ID;

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$ THE ID_EX PIPELINE REGISTER
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
function ID_EX(priority) { this.initialise(priority); }
ID_EX.D = {kReg0: 0, kReg1: 1, kRs: 2, kRt: 3, kRd: 4, kImmediate: 5,
			  kPCPlus4: 6};
ID_EX.prototype = new PipelineReg();
ID_EX.prototype.constructor = ID_EX;

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$ THE EX_MEM PIPELINE REGISTER
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
function EX_MEM(priority) { this.initialise(priority); }
EX_MEM.D = {kBranchAddr: 0, kALUZero: 1, kALUResult: 2, kWriteData: 3, kWriteReg: 4};
EX_MEM.prototype = new PipelineReg();
EX_MEM.prototype.constructor = EX_MEM;

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$ THE MEM_WB PIPELINE REGISTER
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
function MEM_WB(priority) { this.initialise(priority); }
MEM_WB.D = {kReadData: 0, kALUOut: 1, kWriteReg: 2};
MEM_WB.prototype = new PipelineReg();
MEM_WB.prototype.constructor = MEM_WB;

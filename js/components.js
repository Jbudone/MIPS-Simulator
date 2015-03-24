
/**
 * The Wire class represents a simple wired connection between components.
 */
function Wire(output, input, bits, points) {
	this.points = points || [];
	this.bits = bits || 32;
	this.output = output;
	this.input = input;
	this.value = new Bits();
}

Wire.prototype = {
	constructor: Wire,

	putInputOnQueue: function() {
		if (!this.input.queued) {
			/* TODO: */
		}
	},

	setValue: function(value) {
		this.value = value;
		if (this.input.type == Component.type.Immediate) {
			for (var i = 0; i < this.input.outputs.length; ++i) {
				this.input.input();
				this.input.execute();
				this.input.output();
			}
		}
	}
};

Wire.connect = function(output, input, bits, points) {
	return new Wire(output, input, bits, points);
};

Wire.connect32 = function(output, input, points) {
	return new Wire(output, input, 32, points);
};

Wire.connect16 = function(output, input, points) {
	return new Wire(output, input, 16, points);
};


/** 
 * The base component class.
 */
function Component() {
	initialise();
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
			this.inStore[i] = this.inputs[i].value; 
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
		this.inputs = [];
		this.inputMap = {ctrl: [], data: []};
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
		/* Read the input from the wires */
		for (var i = 0; i < this.inputs.length; ++i) {
			this.inStore[i] = this.inputs[i].value; 
		}
		/* Copy the correct inputs to the control signals and data inputs */
		for (var i = 0; i < this.inputMap.ctrl.length; ++i) {
			this.ctrl.inStore[i] = this.inStore[this.inputMap.ctrl[i]];
		}
		for (var i = 0; i < this.inputMap.data.length; ++i) {
			this.data.inStore[i] = this.inStore[this.inputMap.data[i]];
		}
	},

	/**
	 * Method to write the outputs to the output wires.
	 */
	writeOutput: function() {
		if (this.inputMap.ctrl.length > 0) {
			PUT_ON_INPUT_QUEUE(this.ctrl);
		}
		PUT_ON_INPUT_QUEUE(this.data);
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
function ALU(priority) { this.intialise(priority); }


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
function PC(priority) { this.initialise(priority); }
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
	var instr = MIPS.Memory.icache.loadWord(this.inStore[0]);
	this.outStore[0] = instr;
};

// #####################################
// ## DATA MEMORY
// #####################################
function DMem(priority) { this.intitialise(priority); }
DMem.In = {kMemWrite: 0, kAddr: 1, kWriteData: 2};
DMem.Out = {kReadData: 0};
DMem.prototype = new Component();
DMem.prototype.constructor = DMem;
DMem.prototype.execute = function() {
	/* Read */
	var addr = this.inStore[DMem.In.kAddr];
	this.outStore[0] = MIPS.Memory.dcache.loadWord(addr);

	/* Write if needed */
	var shouldWrite = this.inStore[DMem.In.kMemWrite].toInt();
	if (shouldWrite) {
		MIPS.Memory.dcache.storeWord(addr, this.inStore[DMem.In.kWriteData]);
	}
};

// #####################################
// ## THE REGISTER FILE
// #####################################
function Reg(priority) {
	this.initialise(priority);
	this.registers = [];
	for (var i = 0; i < 32; ++i) {
		this.registers[i] = Bits.kZero64;
	}
	this.HI = Bits.kZero64;
	this.LO = Bits.kZero64;
}
Reg.In = {kRegWrite: 0, kReadReg1: 1, kReadReg2: 2,
			 kWriteReg: 3, kWriteData: 4};
Reg.Out = {kReadData1: 0, kReadData2: 1};
Reg.prototype = new Component();
Reg.prototype.constructor = Reg;
Reg.prototype.execute = function() {
	/* Read from the registers */
	var r1 = this.inStore[Reg.In.kReadReg1].toInt();
	var r2 = this.inStore[Reg.In.kReadReg2].toInt();
	this.outStore[Reg.Out.kReadData1] = new Bits(this.registers[r1]);
	this.outStore[Reg.Out.kReadData2] = new Bits(this.registers[r2]);

	/* Write to the write register if need to */
	var shouldWrite = this.inStore[Reg.In.kRegWrite].toInt();
	if (shouldWrite) {
		var wr = this.inStore[Reg.In.kWriteReg].toInt();
		this.registers[wr] = this.inStore[Reg.In.kWriteData];
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
Ctrl.kALUCtrl = 4;
Ctrl.kALUSrc0 = 5;
Ctrl.kALUSrc1 = 6;
Ctrl.kRegDest = 7;
Ctrl.kBranch = 8;
Ctrl.kJump = 9;
Ctrl.kJumpR = 10;
Ctrl.kExtendCtrl = 11;

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
	this.type = Component.type.Immediate;
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
	this.type = Component.type.Immediate;
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
	this.type = Component.type.Immediate;
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
function IF_ID(priority) {
	this.initialise(priority);
	this.inputMap.data = [0];
}
IF_ID.prototype = new PipelineReg();
IF_ID.prototype.constructor = IF_ID;

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$ THE ID_EX PIPELINE REGISTER
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
function ID_EX(priority) {
	this.initialise(priority);
	this.inputMap.ctrl = [Ctrl.kRegWrite, Ctrl.kMemToReg, Ctrl.kMemWrite,
								 Ctrl.kALUOp, Ctrl.kALUSrc0, Ctrl.kALUSrc1,
								 Ctrl.kRegDest, Ctrl.kBranch];
	this.inputMap.data = [ID_EX.In.kPC, ID_EX.In.kReg1, ID_EX.IN.kReg2,
								 ID_EX.In.kI15_0, ID_EX.In.kI20_16, ID_EX.In.kI15_11];
}
ID_EX.In = {kPC: 8, kReg1: 9, kReg2: 10, kI15_0: 11, kI20_16: 12, kI15_11: 13};
ID_EX.Out = {kPC: 0, kReg1: 1, kReg2: 2, kI15_0: 3, kI20_16: 4, kI15_11: 5};
ID_EX.prototype = new PipelineReg();
ID_EX.prototype.constructor = ID_EX;

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$ THE EX_MEM PIPELINE REGISTER
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
function EX_MEM(priority) {
	this.initialise(priority);
	this.inputMap.ctrl = [Ctrl.kRegWrite, Ctrl.kMemToReg, Ctrl.kMemWrite];
	this.inputMap.data = [EX_MEM.In.kBranchAddr, EX_MEM.In.kALUZero, EX_MEM.IN.kALUResult,
								 EX_MEM.In.kWriteData, EX_MEM.In.kWriteReg];
}
EX_MEM.In = {kBranchAddr: 3, kALUZero: 4, kALUResult: 5, kWriteData: 6, kWriteReg: 7};
EX_MEM.Out = {kBranchAddr: 0, kALUZero: 1, kALUResult: 2, kWriteData: 3, kWriteReg: 4};
EX_MEM.prototype = new PipelineReg();
EX_MEM.prototype.constructor = EX_MEM;

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$ THE MEM_WB PIPELINE REGISTER
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
function MEM_WB(priority) {
	this.initialise(priority);
	this.inputMap.ctrl = [Ctrl.kRegWrite, Ctrl.kMemToReg];
	this.inputMap.data = [MEM_WB.In.kReadData, MEM_WB.In.kALUOut, MEM_WB.In.kWriteReg];
}
MEM_WB.In = {kReadData: 2, kALUOut: 3, kWriteReg: 4};
MEM_WB.Out = {kReadData: 0, kALUOut: 1, kWriteReg: 2};
MEM_WB.prototype = new PipelineReg();
MEM_WB.prototype.constructor = MEM_WB;

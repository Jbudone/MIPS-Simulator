
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
ALU.fn = {
	"0010": function(a,b) { return a+b; },
	"0110": function(a,b) { return a-b; },
	"0000": function(a,b) { return a & b; },
	"0001": function(a,b) { return a | b; },
	"1100": function(a,b) { return !(a | b); },
	"0111": function(a,b) { return (a < b) ? 1 : 0; }
};

ALU.prototype = new Component();
ALU.In = {kIn0: 0, kIn1: 1, kALUCtrl: 2};
ALU.Out = {kZero: 0, kResult: 1};
ALU.prototype.constructor = ALU;
ALU.prototype.execute = function() {
	var in0 = this.inStore[ALU.In.kIn0].toInt();
	var in1 = this.inStore[ALU.In.kIn1].toInt();
	var result = ALU.fn[this.inStore[ALU.In.kALUCtrl].s](in0, in1);

	this.outStore[ALU.Out.kZero] = Bits.bit(result == 0);
	if (this.inStore[ALU.In.kIn0].type == Bits.kUnsigned &&
		 this.inStore[ALU.In.kIn1].type == Bits.kUnsigned) {
		this.outStore[ALU.Out.kResult] = Bits.unsigned(result, 32);
	}
	else { /* At least one input is signed */
		this.outStore[ALU.Out.kResult] = Bits.signed(result, 32);
	}
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
	this.outStore[0] = Bits.splice(this.inStore[0], "00");
};

// #######################################
// ## Sign extend a 16 bit number to 32 bits
// #######################################
function SignExtend(priority) { this.initialise(priority); }
SignExtend.prototype = new Component();
SignExtend.prototype.constructor = SignExtend;
SignExtend.prototype.execute = function() {
	var upper = (this.inStore[0][0] == '1') ? Bits.One32.slice(0, 16) : Bits.Zero32.slice(0, 16);
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
// ## THE REGISTER FILE
// #####################################
function Registers(priority) {
	this.initialise(priority);
	this.registers = [];
	for (var i = 0; i < 32; ++i) {
		this.registers[i] = Bits.kZero32;
	}
	this.HI = Bits.kZero32;
	this.LO = Bits.kZero32;
}
Registers.In = {kRegWrite: 0, kReadReg1: 1, kReadReg2: 2,
					 kWriteReg: 3, kWriteData: 4};
Registers.Out = {kReadData1: 0, kReadData2: 1};
Registers.prototype = new Component();
Registers.prototype.constructor = Registers;
Registers.prototype.execute = function() {
	/* Read from the registers */
	var r1 = this.inStore[Registers.In.kReadReg1].toInt();
	var r2 = this.inStore[Registers.In.kReadReg2].toInt();
	this.outStore[Registers.Out.kReadData1] = new Bits(this.registers[r1]);
	this.outStore[Registers.Out.kReadData2] = new Bits(this.registers[r2]);

	/* Write to the write register if need to */
	var shouldWrite = this.inStore[Registers.In.kRegWrite].toInt();
	if (shouldWrite) {
		var wr = this.inStore[Registers.In.kWriteReg].toInt();
		this.registers[wr] = this.inStore[Registers.In.kWriteData];
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
Ctrl.kALUOp = 3;
Ctrl.kALUSrc0 = 4;
Ctrl.kALUSrc1 = 5;
Ctrl.kRegDest = 6;
Ctrl.kBranch = 7;

Ctrl.prototype = new Component();
Ctrl.prototype.constructor = Ctrl;
Ctrl.prototype.execute = function() {

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

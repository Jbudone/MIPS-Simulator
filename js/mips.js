function Memory() {
	this.icache = new MemCache();
	this.dcache = new MemCache();
	//this.stack = new Stack();
}

Memory.prototype = {
	constructor: Memory,
	hasChanged: new Function()
};

function MemCache() {
	this.cache = [];
}

MemCache.prototype = {
	constructor: MemCache,

	load: function(addr, bytes) {
		addr = Bits.str(addr);
		var index = parseInt(addr, 2);
		var data = "";
		for (var i = bytes; i > 0; --i) {
			data = data + this.priv_at(index + bytes-1);
		}
		return new Bits(data);
	},

	loadWord: function(addr) {
		addr = Bits.str(addr);
		var index = parseInt(addr, 2);
		var data = this.priv_at(index + 3) +
				 this.priv_at(index + 2) +
				 this.priv_at(index + 1) +
				 this.priv_at(index);
		return new Bits(data);
	},

	store: function(addr, val, bytes) {
		addr = Bits.str(addr);
		val = Bits.str(val);
		var index = parseInt(addr, 2);
		var bits = bytes * 8;
		for (var i = 0; i < bytes; ++i) {
			this.cache[index + i] = val.slice(bits - (i+1)*8, bits - i*8);
		}
		this.hasChanged(addr, bytes);
	},

	storeWord: function(addr, val) {
		addr = Bits.str(addr);
		val = Bits.str(val);
		var index = parseInt(addr, 2);
		this.cache[index] = val.slice(32 - 8, 32);
		this.cache[index + 1] = val.slice(32 - 16, 32 - 8);
		this.cache[index + 2] = val.slice(32 - 24, 32 - 16);
		this.cache[index + 3] = val.slice(32 - 32, 32 - 24);
		this.hasChanged(addr, 4);
	},

	priv_at: function(idx) {
		return this.cache[idx] || "00000000";
	}
};

function Register(name) {
	this.name = name;
	this.val = Bits.kZero64.slice(0, 32);
}

Register.prototype = {
	constructor: Register,

	set: function(value) {
		this.val = Bits.str(value);
		this.hasChanged();
	},

	hasChanged: new Function()
};

function Mips() {
	this.memory = new Memory();
	this.queue = new MaxHeap();
	this.reg_names = [
		'$zero', '$at',
		'$v0', '$v1',
		'$a0', '$a1', '$a2', '$a3',
		'$t0', '$t1', '$t2', '$t3', '$t4', '$t5', '$t6', '$t7',
		'$s0', '$s1', '$s2', '$s3', '$s4', '$s5', '$s6', '$s7',
		'$t8', '$t9',
		'$k0', '$k1',
		'$gp',
		'$sp',
		'$fp',
		'$ra'
	];
	this.registers = {};
	for (var i = 0; i < this.reg_names.length; ++i) {
		this.registers[i] = new Register(this.reg_names[i]);
	}
	this.registers.HI = new Register('HI');
	this.registers.LO = new Register('LO');
}

Mips.prototype = {
	constructor: Mips,

	step: function() {
		var max_priority = MIPS.queue.max();
		var to_run = [];
		var comp = MIPS.queue.pop(max_priority);
		while (comp) {
			to_run.push(comp);
			comp = MIPS.queue.pop(max_priority);
		}

		/* Run the input stage on all the components */
		for (var i = 0; i < to_run.length; ++i) { to_run[i].readInput(); }

		/* Run the execute stage on all the components */
		for (var i = 0; i < to_run.length; ++i) { to_run[i].execute(); }

		/* Run the output stage on all the components */
		for (var i = 0; i < to_run.length; ++i) { to_run[i].writeOutput(); }
	},

	execStage: function() {
		/* Assumes that starting with the queue looking like:
		 * [PC, IF_ID, ID_EX, EX_EM, MEM_WB], all with same 
		 * priority */
		var stage_priority = this.queue.queue[0].priority;

		do {
			this.step();
		} while (this.queue.max() > stage_priority);
		
	}
};

window.MIPS = window.MIPS || new Mips();

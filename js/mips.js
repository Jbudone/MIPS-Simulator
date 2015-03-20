function Memory() {
	this.icache = new MemCache();
	this.dcache = new MemCache();
	//this.stack = new Stack();
}

Memory.prototype = {
	constructor: Memory
};

function MemCache() {
	this.cache = [];
}

MemCache.prototype = {
	constructor: MemCache,

	loadWord: function(addr) {
		addr = Bits.str(addr);
		var index = parseInt(addr);
		var data = this.priv_at(index + 3) +
				 this.priv_at(index + 2) +
				 this.priv_at(index + 1) +
				 this.priv_at(index);
		return Bits(data, Bits.kUnsigned);
	},

	storeWord: function(addr, val) {
		addr = Bits.str(addr);
		val = Bits.str(val);
		var index = parseInt(addr);
		this.cache[index] = val.slice(32 - 8, 32);
		this.cache[index + 1] = val.slice(32 - 16, 32 - 8);
		this.cache[index + 2] = val.slice(32 - 24, 32 - 16);
		this.cache[index + 3] = val.slice(32 - 32, 32 - 24);
	},

	priv_at: function(idx) {
		return this.cache[idx] || "00000000";
	}
};
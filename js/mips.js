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

	load: function(addr, bytes) {
		addr = Bits.str(addr);
		var index = parseInt(addr);
		var data = "";
		for (var i = bytes; i > 0; --i) {
			data = data + this.priv_at(index + bytes-1);
		}
		return new Bits(data);
	},

	loadWord: function(addr) {
		addr = Bits.str(addr);
		var index = parseInt(addr);
		var data = this.priv_at(index + 3) +
				 this.priv_at(index + 2) +
				 this.priv_at(index + 1) +
				 this.priv_at(index);
		return new Bits(data);
	},

	store: function(addr, val, bytes) {
		addr = Bits.str(addr);
		val = Bits.str(val);
		var index = parseInt(addr);
		var bits = bytes * 8;
		for (var i = 0; i < bytes; ++i) {
			this.cache[index + i] = val.slice(bits - (i+1)*8, bits - i*8);
		}
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

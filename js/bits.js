/**
 * A class that represents a string of bits.
 */
function Bits(str, type) {
	this.s = str || "0";
	this.type = type || Bits.kUnsigned;
}

Bits.kZero64 = "0000000000000000000000000000000000000000000000000000000000000000";
Bits.kOne64 = "1111111111111111111111111111111111111111111111111111111111111111";
Bits.kUnsigned = 0;
Bits.kSigned = 1;

Bits.prototype = {
	constructor: Bits,

	/**
	 * Gets the bits from start:end (inclusive) with the 31:0 representing an 
	 * entire 32 bit string.
	 */
	bits: function(start, end) {
		return new Bits(this.s.slice((this.s.length - 1) - start, this.s.length - end), this.type);
	},

	/**
	 * Create a new Bits object with the value of this one shifted left by 'bits'.
	 */
	shiftLeft: function(bits) {
		return new Bits(this.s.splice(bits) + Bits.kZero64.slice(0, bits),
							 this.type);
	},

	/**
	 * Create a new Bits object with the value of this one shifted right by 'bits' (does an arithmetic shift).
	 */
	shiftRightArithmetic: function(bits) {
		var sign = this.s[0];
		var str = this.s.splice(0, this.s.length - bits);
		if (sign == '0') {
			return new Bits(Bits.kZero64.slice(0, bits) + str, this.type);
		}
		else {
			return new Bits(Bits.kOne64.slice(0, bits) + str, this.type);
		}
	},

	/**
	 * Create a new Bits object with the value of this one shifted right by 'bits'.
	 */
	shiftRight: function(bits) {
		var str = this.s.splice(0, this.s.length - bits);
		return new Bits(Bits.kZero64.slice(0, bits) + str, this.type);
	},
	
	/**
	 * Convert the Bits value to a signed or unsigned integer.
	 */
	toInt: function() {
		if (this.type == Bits.kUnsigned) {
			return parseInt(this.s, 2);
		}
		else { /* Signed int */
			var signed = bits[0] + Bits.Zero64.slice(0, bits.length-1);
			return (-parseInt(signed, 2)) + parseInt(bits.slice(1), 2);
		}
	}
};

/**
 * Create new Bits object with either "0" (false) or "1" (true).
 */
Bits.bit = function(val) {
	if (!val) {
		return new Bits("0", Bits.kUnsigned);
	}
	return new Bits("1", Bits.kUnsigned);
};

/**
 * Create a new Bits value from a signed integer value.
 */
Bits.signed = function(val, bits) {
	var i_val = (val < 0) ? val + Math.pow(2, bits-1) : val;
	var lower = i_val.toString(2);
	var upper_bits = bits - lower.length;
	var upper = (val < 0) ? Bits.One64.slice(0, upper_bits) : Bits.Zero64.slice(0, upper_bits); 
	return new Bits(upper + lower, Bits.kSigned);
};

/**
 * Create a new Bits value that is the combination of 
 * two Bits objects.
 */
Bits.splice = function(upper, lower) {
	var type = Bits.kUnsigned;
	if (typeof(upper) !== 'string') {
		type = type | upper.type;
		upper = upper.s;
	}
	if (typeof(lower) !== 'string') {
		type = type | lower.type;
		lower = lower.s;
	}
	return new Bits(upper + lower, type);
};

/**
 * Get the actual binary bit string from a value.
 */
Bits.str = function(val) {
	if (typeof(val) !== 'string') {
		if (typeof(val) === 'number') {
			/* Assumes unsigned */
			return val.toString(2);
		}
		/* Assumes is a Bits object. */
		return val.s;
	}
	return val;
};

/**
 * Create a new Bits value from an unsigned integer.
 */
Bits.unsigned = function(val, bits) {
	var lower = val.toString(2);
	return new Bits(Bits.Zero64.slice(0, bits-lower.length) + lower, Bits.kUnsigned);
};

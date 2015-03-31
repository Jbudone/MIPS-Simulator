function MaxHeap() {
	this.length = 0;
	this.queue = [];
}

MaxHeap.parent = function(idx) {
	return Math.ceil(idx / 2.0 - 1);
};

MaxHeap.left = function(idx) {
	return (idx*2) + 1;
};

MaxHeap.right = function(idx) {
	return (idx*2) + 2;
};

MaxHeap.prototype = {
	constructor: MaxHeap,

	// Insert a value into the max heap.
	insert: function(val) {
		if (!val.queued) {
			this.queue.push(val);
			val.queued = true;
			this.bubble(this.length);
			this.length = this.length + 1;
			return true;
		}
		else {
			return false;
		}
	},

	// Get the max priority in the queue of any item right now.
	max: function() {
		if (this.length > 0) {
			return this.queue[0].priority;
		}
		return 0;
	},

	// Look at the item in the top of the heap.
	peek: function() {
		if (this.length > 0) {
			return this.queue[0];
		}
		return undefined;
	},

	// Get the next item off the heap >= the specified priority.
	pop: function(priority) {
		if (priority == undefined) { priority = -1; }
		if (this.length > 0 && this.queue[0].priority >= priority) {
			var val = this.queue[0];
			var last = this.queue.pop();

			this.length = this.length - 1;
			if (this.length > 0) {
				this.queue[0] = last;
				this.fixHeap(0);
			}
			val.queued = false;
			return val;
		}
		return undefined;
	},

	// Bubble the specified item to its proper place in the queue.
	bubble: function(idx) {
		if (idx == 0) { return; }

		var p_idx = MaxHeap.parent(idx);
		if (this.swap(p_idx, idx)) {
			this.bubble(p_idx);
		}
	},

	// Make the heap a max heap again.
	fixHeap: function(idx) {
		var l_idx = MaxHeap.left(idx);
		var r_idx = MaxHeap.right(idx);

		if (this.swap(idx, l_idx)) {
			this.fixHeap(l_idx);
		}
		else if (this.swap(idx, r_idx)) {
			this.fixHeap(r_idx);
		}
		else if (idx == 0) {
			return;
		}
		this.fixHeap(0);
	},

	// Swap two values if needed, and return true if the values were swapped.
	swap: function(maxIdx, minIdx) {
		var max_val = (this.queue[maxIdx]) ? this.queue[maxIdx].priority : -1;
		var min_val = (this.queue[minIdx]) ? this.queue[minIdx].priority : -1;

		if (max_val < min_val) {
			var tmp = this.queue[maxIdx];
			this.queue[maxIdx] = this.queue[minIdx];
			this.queue[minIdx] = tmp;
			return true;
		}
		return false;
	}

};

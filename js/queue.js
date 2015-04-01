function MaxHeap() {
	this.queue = [];
}

MaxHeap.prototype = {
	constructor: MaxHeap,

	insert: function(val) {
		if (!val.queued) {
			if (this.queue.length == 0) { this.queue.push(val); }
			else {
				var in_queue = false;
				for (var i = 0 ; i < this.queue.length; ++i) {
					if (this.queue[i].priority < val.priority) {
						this.queue.splice(i, 0, val);
						in_queue = true;
						break;
					}
				}
				if (!in_queue) { this.queue.push(val); }
			}
			val.queued = true;
			return true;
		}
		return false;
	},

	// Get the max priority in the queue of any item right now.
	max: function() {
		if (this.queue.length > 0) { return this.queue[0].priority; }
		return 0;
	},

	// Look at the item in the top of the heap.
	peek: function() {
		if (this.queue.length > 0) { return this.queue[0]; }
		return undefined;
	},

	// Get the next item off the heap >= the specified priority.
	pop: function(priority) {
		if (priority == undefined) { priority = -1; }
		if (this.queue.length > 0 && this.queue[0].priority >= priority) {
			var val = this.queue.shift();
			val.queued = false;
			return val;
		}
		return undefined;
	}
};

define(function(){

	/* Keys
	 *
	 * Allows us to easily manage global keys
	 ****/
	var Keys = {

		_keys: [],
		add: function(name){
			
			if (name instanceof Array) {
				for (var i=0; i<name.length; ++i) {
					this.add(name[i]);
				}

				return;
			}

			if (window.hasOwnProperty(name)) {
				throw new Error("Key ("+name+") already defined!");
			}

			this._keys.push(name);
			window[name] = this._keys.length; // NOTE: key[0] will have value 1
		},
	};

	return Keys;
});

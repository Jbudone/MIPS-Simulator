define(function(){

	var Canvas = function(_settings){

		var _el      = $('#processor'),
			ctx      = _el[0].getContext('2d'),
			settings = _.defaults(_settings || {},
				{
					updateTime: 50,
					assetsPath: 'assets/',

					background: '#FAFAFA',

					wireColour: 'rgb(0, 0, 0)',
					wireHighlight: 'rgb(0, 0, 128)',
					wireWidth: 1,
					wireHighlightWidth: 3,
				}),
			dimensions = {},
			components = {},
			wires = [],
			highlightedComponents = [],
			holdingComponent = null,
			hasUpdated = true,
			assets = {};

		/**
		 *	Add an asset image into the list of assets. If this asset already exists then this function does
		 *	nothing. A placeholder is created immediate so that components can reference the asset before its
		 *	ready.
		 */
		this.addAsset = function(id, file){
			
			if (!assets.hasOwnProperty(id)) {
				assets[id] = {
					image: null
				};

				var image = new Image();
				image.onload = function(){
					assets[id].image = image;
					hasUpdated = true;
				};

				image.src = settings.assetsPath + file;
			}
		};

		/**
		 * 	Clear and redraw the entire canvas. This function should only be called if something changes..
		 * 	There is absolutely no reason to call it when nothing has changed
		 */
		this.redraw = function(){

			// Clear the canvas
			ctx.fillStyle = settings.background;
			ctx.fillRect(0, 0, dimensions.width, dimensions.height);

			// Draw each wire first (will appear behind components). Wires have a reference to their source
			// and destination components, and will use their position properties as a start and end point.
			// The start and end points will align to the center of the asset; however, if the wire is
			// slightly slanted to go from the previous point to the last, it will attempt to horizontally and
			// vertically align the wire.
			ctx.strokeStyle = settings.wireColour;
			ctx.lineWidth = settings.wireWidth;
			for (var i=0; i<wires.length; ++i) {
				var wire = wires[i],
					prevPoint  = {x: wire.source.position.x, y: wire.source.position.y},
					lastPoint  = {x: wire.destination.position.x, y: wire.destination.position.y};

				if (wire.highlighted) {
					ctx.strokeStyle = settings.wireHighlight;
					ctx.lineWidth = settings.wireHighlightWidth;
				}

				// Center the first and last points to the center of the component
				prevPoint.x += wire.source.dimensions.width / 2;
				prevPoint.y += wire.source.dimensions.height / 2;
				lastPoint.x += wire.destination.dimensions.width / 2;
				lastPoint.y += wire.destination.dimensions.height / 2;

				// Points are relative from the last point. So we draw the path and continuously add to the
				// previous point
				ctx.beginPath();
				ctx.moveTo(prevPoint.x, prevPoint.y);
				for (var p=0; p<wire.points.length; ++p) {
					var nextPoint = wire.points[p];

					ctx.lineTo(prevPoint.x + nextPoint.x, prevPoint.y + nextPoint.y);

					prevPoint.x += nextPoint.x;
					prevPoint.y += nextPoint.y;
				}

				// Fix the last point to attempt to make it align with the horizontal or vertical ruler. If
				// the last point can be shifted to align horizontally and/or vertically such that it will
				// stay lay underneath the component, then do that.
				var offByX = lastPoint.x - prevPoint.x,
					offByY = lastPoint.y - prevPoint.y;
				
				if (offByX != 0) {
					if (prevPoint.x >= wire.destination.position.x &&
						prevPoint.x <= wire.destination.position.x + wire.destination.dimensions.width) {
							lastPoint.x = prevPoint.x;
						}
				}

				if (offByY != 0) {
					if (prevPoint.y >= wire.destination.position.y &&
						prevPoint.y <= wire.destination.position.y + wire.destination.dimensions.height) {
							lastPoint.y = prevPoint.y;
						}
				}

				ctx.lineTo(lastPoint.x, lastPoint.y);
				ctx.stroke();

				if (wire.highlighted) {
					ctx.strokeStyle = settings.wireColour;
					ctx.lineWidth = settings.wireWidth;
				}
			}

			// Draw each component
			ctx.fillStyle = '#333333';
			for (var uid in components) {
				var component = components[uid];

				if (component.asset) {
					if (component.asset.image) {
						ctx.drawImage(component.asset.image, component.position.x, component.position.y, component.dimensions.width, component.dimensions.height);
					}
				} else {
					ctx.fillRect(component.position.x, component.position.y, component.dimensions.width, component.dimensions.height);
				}
			}
		};

		this.unhighlight = function(){

			for (var i=0; i<highlightedComponents.length; ++i) {
				highlightedComponents[i].highlighted = false;
			}

			highlightedComponents = [];
			hasUpdated = true;
		};

		this.update = function(){

			if (hasUpdated) {
				this.redraw();
				hasUpdated = false;
			}

			setTimeout(this.update.bind(this), settings.updateTime);
		};

		this.initialize = function(){

			// Canvas dimensions
			var resetDimensions = function(){
				dimensions.width = _el.width();
				dimensions.height = _el.height();

				ctx.canvas.width = dimensions.width;
				ctx.canvas.height = dimensions.height;
			};
			$(window).resize(function(){
				resetDimensions();
				hasUpdated = true;
			});
			resetDimensions();

			this.update();
		};

		this.addComponent = function(component, regionID, _properties){

			var properties = _.defaults(_properties || {},
					{
						position: { x: 0, y: 0 },
						dimensions: { width: 20, height: 20 },
						asset: { id: 'placeholder', 'file': 'smiley-face.jpg' },
					});

			this.addAsset(properties.asset.id, properties.asset.file);

			var _component = {
				position: properties.position,
				details: component,
				region: regionID,
				dimensions: properties.dimensions,
				asset: assets[properties.asset.id],
				highlighted: false
			};
			components[component.uid] = _component;
			component.hasChanged = function(){
				highlightedComponents.push(_component);
				_component.highlighted = true;
				hasUpdated = true;
			};

			hasUpdated = true;
		};

		this.addWire = function(wire){

			var _wire = {
				source: components[wire.input.uid],
				destination: components[wire.output.uid],
				points: wire.points,
				highlighted: false
			};

			wires.push(_wire);
			wire.hasChanged = function(){
				highlightedComponents.push(_wire);
				_wire.highlighted = true;
				hasUpdated = true;
			};

			hasUpdated = true;
		};


		this.initialize();
	};

	return Canvas;
});

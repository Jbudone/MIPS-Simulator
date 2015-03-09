define(function(){

	var Canvas = function(_settings){

		var _el      = $('#processor'),
			ctx      = _el[0].getContext('2d'),
			settings = _.defaults(_settings || {},
				{
					updateTime: 50,
					editorMode: true,

					background: '#FAFAFA'
				}),
			dimensions = {},
			components = {},
			holdingComponent = null,
			hasUpdated = true;

		this.redraw = function(){

			ctx.fillStyle = settings.background;
			ctx.fillRect(0, 0, dimensions.width, dimensions.height);

			// Temporary section for drawing components...at least until we have graphics assets
			ctx.fillStyle = '#333333';
			for (var uid in components) {
				var component = components[uid];

				ctx.fillRect(component.position.x, component.position.y, component.dimensions.width, component.dimensions.height);
			}
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
			});
			resetDimensions();

			// Moving components (editor functionality)
			if (settings.editorMode) {
				var mousePos = null;
				_el.on('mousedown', function(evt){

					var x = evt.clientX - _el.offset().left,
						y = evt.clientY - _el.offset().top;
					for (var uid in components) {
						var component = components[uid];

						if (x > component.position.x && x < (component.position.x + component.dimensions.width) &&
							y > component.position.y && y < (component.position.y + component.dimensions.height)) {

							holdingComponent = component;
							break;
						}
					}
				}).on('mouseup', function(){
					holdingComponent = null;
				}).on('mousemove', function(evt){
					if (holdingComponent) {
						
						var x = evt.clientX - _el.offset().left,
							y = evt.clientY - _el.offset().top;

						holdingComponent.position.x = x;
						holdingComponent.position.y = y;
						hasUpdated = true;
					}


				});
			}

			this.update();
		};

		this.addComponent = function(component, regionID){

			components[component.uid] = {
				position: { x: 0, y: 0 },
				dimensions: { width: 20, height: 20 },
				details: component,
				region: regionID
			};
			hasUpdated = true;
		};


		this.initialize();
	};

	return Canvas;
});

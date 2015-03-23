define(function(){

	var Canvas = function(_settings){

		var _el      = $('#processor'),
			ctx      = _el[0].getContext('2d'),
			settings = _.defaults(_settings || {},
				{
					updateTime: 50,
					assetsPath: 'assets/',

					background: '#FAFAFA'
				}),
			dimensions = {},
			components = {},
			holdingComponent = null,
			hasUpdated = true,
			assets = {};

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

		this.redraw = function(){

			ctx.fillStyle = settings.background;
			ctx.fillRect(0, 0, dimensions.width, dimensions.height);

			// Temporary section for drawing components...at least until we have graphics assets
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

			components[component.uid] = {
				position: properties.position,
				details: component,
				region: regionID,
				dimensions: properties.dimensions,
				asset: assets[properties.asset.id]
			};
			hasUpdated = true;
		};


		this.initialize();
	};

	return Canvas;
});

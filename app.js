var express = require('express');
var mongoose = require('mongoose');

var BodyParser = require('body-parser');

var multer = require('multer');
var cloudinary = require("cloudinary");

var app_password="619733021";
var method_override = require("method-override");
var Schema = mongoose.Schema;



cloudinary.config({
	cloud_name: "antiarodriguezcastro",
	api_key: "683494228495174",
	api_secret: "OhOxAIDTbg3v7oJeyd91gHukPfY"
});

var app = express();

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({extended: false}));
app.use(method_override("_method"));

mongoose.connect(process.env.MONGOLAB_URI || "mongodb://localhost/primera");


var uploader = multer({dest: "./uploads"});
var middleware_upload = uploader.single('avatar');

//Definimos el esquema de nuestros productos en la db
var articuloEsquemaJSON={
	titulo:String,
	descripcion:String,
	imagenUrl:String,
	precio:Number
};

var articuloEsquema = new Schema(articuloEsquemaJSON);
articuloEsquema.virtual("imagen.url").get(function(){
	
	if(this.imagenUrl == null || this.imagenUrl ==="" || this.imagenUrl ==="data.png"){
		
		return "/img/shopping.jpg";
	}
	return this.imagenUrl;
});

var Articulo = mongoose.model("Articulo",articuloEsquema);

app.set("view engine","jade");

app.use(express.static("public"));

app.get("/",function(solicitud,respuesta){
	respuesta.render("index");
});

app.get("/menu",function(solicitud,respuesta){
	Articulo.find(function(error,documento){
		if(error){console.log("error");}
		respuesta.render("menu/index",{productos: documento});
	});
	
});
app.post("/admin",function(solicitud,respuesta){
	if (solicitud.body.password == app_password) {
		Articulo.find(function(error,documento){
			if(error){console.log("error");}
			respuesta.render("admin/index",{productos: documento});
		});
	}else{
		respuesta.redirect("/");
	}
});

app.get("/admin",function(solicitud,respuesta){	
	respuesta.render("admin/form");
});
app.post('/menu', middleware_upload, function(solicitud,respuesta){

	if (solicitud.body.password == app_password) {
		console.log("password ok");
		var data = {
			titulo: solicitud.body.titulo,
			descripcion:solicitud.body.descripcion,
			precio:solicitud.body.precio
		};
		var product = new Articulo(data);
		if(solicitud.file){
			cloudinary.uploader.upload(solicitud.file.path,function(result){
				console.log(result);
				product.imagenUrl = result.url;
				product.save(function(err){
					console.log(product);
					respuesta.redirect("/menu");
				});
			});
		}else{
			product.save(function(err){
				console.log(product);
				respuesta.redirect("/menu");
			});
		}
		

		
	}else{
		console.log("password ko");
		respuesta.render("menu/new");
	}

	
	
});

app.put("/menu/:id", middleware_upload,function(solicitud,respuesta){
	console.log("entra en el put");
	if (solicitud.body.password == app_password) {
		console.log("contraseña correcta");
		var data = {
			titulo: solicitud.body.titulo,
			descripcion:solicitud.body.descripcion,
			precio:solicitud.body.precio
		};

		if(solicitud.file){
			cloudinary.uploader.upload(solicitud.file.path,function(result){
				data.imagenUrl = result.url;	
				Articulo.update({"_id":solicitud.params.id},data,function(){
					respuesta.redirect("/menu");
				});
			});
		}else{
			Articulo.update({"_id":solicitud.params.id},data,function(){
				respuesta.redirect("/menu");
			});
		}
	}else{
		console.log("contraseña incorrecta ", solicitud.body.password);
		respuesta.redirect("/");
	}

});

app.get("/menu/editar/:id",function(solicitud,respuesta){
	var id_producto = solicitud.params.id;
	Articulo.findOne({_id : id_producto},function(error,producto){
		console.log(producto);
		respuesta.render("menu/edit",{producto : producto});
	});
	
});

app.get("/menu/new",function(solicitud,respuesta){
	respuesta.render("menu/new");
});

app.get("/menu/delete/:id",function(solicitud,respuesta){
	var id_producto = solicitud.params.id;
	Articulo.findOne({_id : id_producto},function(error,producto){
		respuesta.render("menu/delete",{producto : producto});
	});
});

app.delete("/menu/:id",function(solicitud,respuesta){
	var id_producto = solicitud.params.id;
	if (solicitud.body.password == app_password) {
		Articulo.remove({_id: id_producto},function(error){
			if(error){
				console.log(error);
			}else{
				respuesta.redirect("/menu");
			}
		});
	}else{
		respuesta.redirect("/menu");
	}
});

app.listen(8080);
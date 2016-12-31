var express = require("express");
var Imagen = require("./models/imagenes");
var router = express.Router();
var fs = require("fs");
var formidable = require("formidable");
var redis = require("redis");

var client = redis.createClient();

var image_finder_middleware = require("./middlewares/find_image")

router.get("/",function(req,res){
    Imagen.find({creator: res.locals.user._id}).populate("creator")
                            .exec(function(err,imagenes){
                                    if (err) console.log(err);
                                    res.render("app/home", {imagenes: imagenes});
                            })
});

router.get("/imagenes/new",function(req,res){
    res.render("app/imagenes/new");
});

router.all("/imagenes/:id*",image_finder_middleware);

router.get("/imagenes/:id/edit",function(req,res){
     res.render("app/imagenes/edit");

});

router.route("/imagenes/:id")
    .get(function(req,res){
		//client.publish("images", res.locals.imagen.toString());
        res.render("app/imagenes/show");
    })
    .put(function(req,res){  
        res.locals.imagen.title = req.body.title;
        res.locals.imagen.save(function(err){
            if(!err){
                res.render("app/imagenes/show");
            }else{
                res.render("app/imagenes/"+req.params.id+"/edit");
            }
        })  
    })
    .delete(function(req,res){
        Imagen.findOneAndRemove({_id: req.params.id},function(err, data){
            if(!err){
				fs.unlink("public/imagenes/"+data._id+"."+data.extension, function(err){
					if (!err) console.log("error al borrar el fichero: " + err);
					console.log("fichero borrado");
				});
				//console.log("borrar : " + data);
                res.redirect("/app/imagenes");
            }else{
                console.log(err);
                res.redirect("/app/imagenes"+req.params.id);
            }
        })
    });
router.route("/imagenes")
    .get(function(req,res){
        Imagen.find({creator: res.locals.user._id},function(err,imagenes){
            if(err){ res.redirect("/app");return; }
            res.render("app/imagenes/index",{imagenes: imagenes});
        });
    })
    .post(function(req,res){	
		var form = new formidable.IncomingForm();

		var data = {
			title: "",
			creator: res.locals.user._id,
			extension: ""
		}
		
		var path = "";
		
		form.on("field", function (field, value) {
			data.title = value;
		})
		form.on("file", function(name, file) {
			data.extension = file.name.split(".").pop(); 
			path = file.path;
		})
		form.on("end", function() {
			var imagen = new Imagen(data);
			imagen.save(function(err){
				if(!err){
					var imgJSON = {
						"id" : imagen._id,
						"title" : imagen.title,
						"extension" : imagen.extension
					}
				
					client.publish("images", JSON.stringify(imgJSON));
					fs.rename(path, "public/imagenes/"+imagen._id+"."+data.extension);
					res.redirect("/app/imagenes/"+imagen._id)
				}
				else{
					console.log(imagen);
					res.render(err);
				}
			});
		});
		form.parse(req);
	});

module.exports = router;
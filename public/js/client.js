var socket = io();

socket.on("new image", function(data){
	console.log("on new image");
	console.log("recibo el mensaje en client.js " + data);
	
	data = JSON.parse(data);
	var container = document.querySelector("#imagenes");
	console.log(" client.js "+ data);
	
	var source = document.querySelector("#image-template").innerHTML;
	
	var template = Handlebars.compile(source);
	container.innerHTML = template(data) + container.innerHTML;
});
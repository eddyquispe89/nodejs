module.exports = function(server,sessionMiddleware){
	var io = require("socket.io")(server);
	var redis = require("redis");
	var client = redis.createClient();
	
	client.subscribe("images");
	
	io.use(function(socket, next){
		sessionMiddleware(socket.request, socket.request.res, next);
	});
	
	client.on("message", function(channel, message) {
//		console.log(message);
		if (channel=="images") {
			console.log("emitimos el mensaje " + message);
			io.emit("new image", message);
		}
	});
	
	io.sockets.on("connection", function(socket){
		console.log(socket.request.session.user_id);
	});
}



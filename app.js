//app.js
var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/',function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(2000);
console.log("Server started.");

var SOCKET_LIST = {};
var set=null;

var Player = function(id){
	var self ={
    x:20,
    y:250,
    id:id,
  };

	self.pressingUp = false;

	self.updateJump = function(){
		if(self.pressingUp)
			self.y -= 10;
	}
	Player.list[id] = self;
	return self;
}
Player.list = {};
Player.onConnect = function(socket){
	var player = Player(socket.id);
	socket.on('keyPress',function(data){
		if(data.inputId === 'Up')
			player.pressingUp = data.state;
	});
  socket.on('gameover',function(data){
    if(data.inputId==='Over')
      clearInterval(set);
      inititalize();
  });
}

Player.onDisconnect = function(socket){
	delete Player.list[socket.id];
}
Player.update = function(){
	var pack = [];
	for(var i in Player.list){
		var player = Player.list[i];
		player.updateJump();
    player.y+=2.3;
		pack.push({
			x:player.x,
			y:player.y,
		});
	}
	return pack;
}
var Pipe=function(){
  var self={
    x:288,
    y:Math.floor(Math.random()*242)-242,
  };
  self.id=Math.random();
  Pipe.list[self.id]=self;
}
Pipe.list={}
Pipe();
var pipe_update = function(){
	var pack = [];
  for(var i in Pipe.list){
    var pipe=Pipe.list[i];
    if(pipe.x==125){
      Pipe();
    }
    pipe.x-=1;
    pack.push({
        x:pipe.x,
        y:pipe.y,
    });
  }
	return pack;
}
var inititalize=function(){
  Pipe.list={};
  Player.list={};
  Pipe();
}
var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;
	Player.onConnect(socket);

  clearInterval(set);
  set=setInterval(connection,1000/25);

	socket.on('disconnect',function(){
		delete SOCKET_LIST[socket.id];
		Player.onDisconnect(socket);
	});

});

function connection(){
	var pack ={
    player:Player.update(),
    pipe:pipe_update(),
  }

	for(var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];
		socket.emit('newPositions',pack);
	}
}

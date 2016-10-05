var names = [];
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var port = Number(process.env.PORT || 3000);

var names = [];
var socketIds = [];
var xPos = [];
var yPos = [];
var colors = [];
var scores = [];

var balls = [];

app.get('/', function(req, res){
	res.sendfile('index.html');
});

io.on('connection', function(socket){
	console.log('user connected');
	
	socket.on('addMePlease', function(msg){
		names.push(msg);
		socketIds.push(socket.id);
		colors.push(getRandomColor());
		xPos.push(10 + Math.random()*580);
		yPos.push(10 + Math.random()*580);
		socket.emit('newInfoHere', {nameList: names, xList: xPos, yList: yPos, colorList: colors, scoreList: scores});
		socket.emit('heresYourId', names.length - 1);
		socket.broadcast.emit('newMessageToAdd', {name: "GAME", message: '"' + msg + '" has joined.'});
	});
	
	socket.on('newNamePlease', function(msg){
		var newName = msg;
		for(var i = 0; i < names.length; i ++){
			if(socketIds[i] == socket.id){
				io.emit('newMessageToAdd', {name: "GAME", message: '"' + names[i] + '" has changed his/her name to "' + newName + '"'});
				names[i] = newName;
				colors[i] = getRandomColor();
				socket.emit('newInfoHere', {nameList: names, xList: xPos, yList: yPos, colorList: colors, scoreList: scores});
				break;
			}
		}
	});
  
	socket.on('newInfoPlease', function(){
		socket.emit('newInfoHere', {nameList: names, xList: xPos, yList: yPos, colorList: colors, scoreList: scores});
	});
  
	socket.on('myInfoInc', function(msg){
		var x = msg.x;
		var y = msg.y;
		var score = msg.score;
		for(var i = 0; i < names.length; i ++){
			if(socketIds[i] == socket.id){
				xPos[i] = x;
				yPos[i] = y;
				scores[i] = score;
				break;
			}
		}
	});
  
	socket.on('disconnect', function(){
		for(var i = 0; i < names.length; i ++){
			if(socketIds[i] == socket.id){
				io.emit('newMessageToAdd', {name: "GAME", message: '"' + names[i] + '" has disconnected.'});
				names.splice(i, 1);
				socketIds.splice(i, 1);
				xPos.splice(i, 1);
				yPos.splice(i, 1);
				colors.splice(i, 1);
				scores.splice(i, 1);
				break;
			}
		}
	});
	
	socket.on('newMessageToSend', function(msg){
		for(var i = 0; i < names.length; i ++){
			if(socketIds[i] == socket.id){
				io.emit('newMessageToAdd', {name: names[i], message: msg});
				break;
			}
		}
	});
	
});

http.listen(port, function(){
	console.log('listening on *:3000');
	setInterval(generateBall, 90);
	setInterval(updateBalls, 20);
});

function generateBall(){
	doingBalls = true;
	var x = Math.random()*600;
	var y = Math.random()*600;
	var r = 5 + Math.random()*15;
	var vx = .05 + Math.random()*.2;
	var vy = .05 + Math.random()*.2;
	vx*=10;
	vy*=10;
	if(x > 300) vx = -vx;
	if(y > 300) vy = -vy;
	var badBall = false;
	for(var j = 0; j < 10; j ++){
		for(var i = 0; i < names.length; i ++){
			if( (Math.abs(x - xPos[i]) < 100) || (Math.abs(y - yPos[i]) < 100) ){
				badBall = true;
			}
		}
		if(!badBall){
			var ball = {X: x, Y: y, R: r, VX: vx, VY: vy};
				balls.push(ball);
				break;
		}else{
			x = Math.random()*600;
			y = Math.random()*600;
		}
	}
}

function updateBalls(){
	for(var i = 0; i < balls.length; i ++){
		if( (balls[i].X > (600 + balls[i].R)) || (balls[i].X < (0 - balls[i].R)) || (balls[i].Y > (600 + balls[i].R)) || (balls[i].Y < (0 - balls[i].R)) ){
			balls.splice(i, 1);
		}else{
			balls[i].X += balls[i].VX;
			balls[i].Y += balls[i].VY;
		}
	}
	io.emit('ballInfo', balls);
}

function checkForCollisions(socket){
	for(var i = 0; i < names.length; i ++){
		for(var j = 0; j < names.length; j ++){
			if(i != j){
				var dx = xPos[i] - xPos[j];
				var dy = yPos[i] - yPos[j];
				if(Math.sqrt(dx * dx + dy * dy) < 2 * 10){
					//uhhh... this part is hard
					console.log('collision');
					//socket.broadcast.to(socketIds[i]).emit('collision');
					//socket.broadcast.to(socketIds[j]).emit('collision');
				}
			}
		}
	}
}

function getRandomColor() {
	var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
    //return 'rgb(' + Math.random()*255 + ', ' + Math.random()*255 + ', ' + Math.random()*255 + ")";
}
/*
npm install --save express@4.10.2
npm install --save socket.io
*/
var WebSocketClient = require('websocket').client;


function getUTC(){
	return parseInt(new Date().getTime()/1000);
}
var bootTime=getUTC();

var backupBootsequenceTimeout=120; //Seconds

var backupBootsequenceTimeout=60;
var backupSequence=[
{ "addr": 4, "state": 1 },
{ "dimAddr": 2, "val": 0 },
{ "addr": 3, "state": 1 },
];

function onOffline(){
	var now = getUTC();
	var timeSinceBoot=now-bootTime;
	console.log(timeSinceBoot+" sec since boot threshold for backup loading "+backupBootsequenceTimeout)
	if(timeSinceBoot<backupBootsequenceTimeout){
		console.log("!!! +Using backup configuration !!!")
		for(var i=0;i<backupSequence.length;i++){

			onMessage(backupSequence[i]);
		}
	}
}
onOffline();

/*Application logic*/
function onMessage(msg){
	console.log(msg)



	/*Nexa messages*/
	if(msg.addr&&msg.state!==null){
		console.log("Nexa message received!");
sendCommand("../nexa/main",[msg.addr,msg.state]);

	}	

	if(msg.dimAddr&&msg.val!==null){
		console.log("Nexa message received!");
sendCommand("../nexa/main",[msg.dimAddr,16-msg.val,"dimmer"]);

	}

	if(msg.poke){
		sendHeartbeat();
	}
}


function sendCommand(cmd,argv){
	'use strict';

	const
	spawn = require( 'child_process' ).spawnSync,
	ls = spawn( cmd, argv);

//	console.log( `stderr: ${ls.stderr.toString()}` );
//	console.log( `stdout: ${ls.stdout.toString()}` );
}



function isJsonString(str) {
	try {
		JSON.parse(str);
	} catch (e) {
		return false;
	}
	return true;
}
var ip = require("ip");


function sendHeartbeat(){
		var datetime = new Date().toJSON().slice(0,10) 
    + " " + new Date(new Date()).toString().split(' ')[4];
	if(connection)
		connection.sendUTF("RPI Alive ip="+ip.address()+" @ "+datetime);
	console.log("heartbeat")
}
setInterval(function(){
sendHeartbeat();
}, 30*1000)


/*Websocket stuff*/
var fs = require('fs');
var path="../../websocket_address.ip";
var serverAddress="ws://youraddresshere.cow:9001";
var connection=null;

try{
	serverAddress = fs.readFileSync(path, 'utf8');
} catch(e){
	console.error("ERROR! Please specify an IP address in a text file at "+path);
	console.error("The file should contain an address in the following format:");
	console.error("ws://123.321.123.321:9400");
	console.error("OBS! Do not add a new line character at the end of the address!");
}
//serverAddress="ws://123.321.123.321:9400"
var client = new WebSocketClient();

client.on('connectFailed', function(error) {
	onOffline();
	console.log('Connect Error: ' + error.toString());
});

client.on('connect', function(c) {
	connection=c;
	console.log('WebSocket Client Connected');


	connection.on('error', function(error) {
		onOffline();
		console.log("Connection Error: " + error.toString());
	});

	connection.on('close', function() {
		onOffline();
		console.log('Connection Closed');
	});

	connection.on('message', function(message) {
		if (message.type === 'utf8') {
        //    console.log("Received: '" + message.utf8Data + "'");
        if(isJsonString(message.utf8Data)){
        	onMessage(JSON.parse(message.utf8Data));
        }else{
        	console.log("nonJSON: "+message.utf8Data);
        }
    }
});

});

console.log("Connecting to server "+serverAddress)
client.connect(serverAddress);
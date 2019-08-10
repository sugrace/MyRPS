(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
let socket;
let socketId;
const localVideo = document.getElementById('localVideo');
const Room_Number = document.getElementById('Room_number');
const remoteVideo = document.getElementById('remoteVideo');
const RockButton = document.getElementById('Rock');
const ScissorsButton = document.getElementById('Scissors');
const PaperButton = document.getElementById('Paper');

let MyStatus = undefined;
let OpponentStatus = undefined;
let MyHand = undefined;
let OpponentHand = undefined;
let buttonAlive = true;
let unlocked = true;
let connections = [];
let inboundStream = null;
let stream_cnt=0;
let video;
let myname = '';
const masterName_title = document.getElementById('username');
const masterName_val = document.getElementById('masterName');
const me = document.getElementById('me');
const opponent = document.getElementById('opponent');
const ret = document.getElementById('ret');
const WinCount = document.getElementById('WinCount');
let count=0;
let currentFilter;
var peerConnectionConfig = {
    iceServers: [
        {
            urls:[  'stun:stun.l.google.com:19302',
                    'stun:stun1.l.google.com:19302',
                    'stun:stun2.l.google.com:19302',
                    'stun:stun3.l.google.com:19302',
                    'stun:stun4.l.google.com:19302',
                ]},
                {
                    username: "9SGbAp-qOEePWOL7UbFZTuuF_aRgH-h6x4TaFdT8MdTi_HSD54w79wM--rkhwnxAAAAAAF0WilZldmVl",
                    credential: "f762b15e-99ed-11e9-82a9-066b071c7196",
                    urls: [
                        "turn:tk-turn2.xirsys.com:80?transport=udp",
                        "turn:tk-turn2.xirsys.com:3478?transport=udp",
                        "turn:tk-turn2.xirsys.com:80?transport=tcp",
                        "turn:tk-turn2.xirsys.com:3478?transport=tcp",
                        "turns:tk-turn2.xirsys.com:443?transport=tcp",
                        "turns:tk-turn2.xirsys.com:5349?transport=tcp"
                    ]
                 }
            ]
};
let localStream;
let token;
let call_token;
let data = {
    type: '',
    Hand: ''
}
RockButton.addEventListener('click',()=>{
if(buttonAlive && Object.keys(connections).length > 0){
   
    MyStatus = 'completed';
    MyHand = 'Rock';
    console.log(MyStatus,OpponentStatus)
    me.innerHTML = 'Me : Rock'
    opponent.innerHTML = 'Opponent : pending...'
    buttonAlive = false;
    if(MyStatus && OpponentStatus){
        data.type = 'finished';
        data.Hand = MyHand;
        SendData(data)
    }else{
        data.type = 'selected';
        data.Hand = '';
        SendData(data);
    }
}else{
    if(buttonAlive == false){
        alert('You have already given it out Please wait for the result.');
    }else{
        alert('There is no partner.')
    }
}


});
ScissorsButton.addEventListener('click',()=>{
    if(buttonAlive && Object.keys(connections).length > 0){
       
        
        MyStatus = 'completed';
        MyHand = 'Scissors';
        me.innerHTML = 'Me : Scissors'
        opponent.innerHTML = 'Opponent : pending...'
        buttonAlive = false;
        if(MyStatus && OpponentStatus){
            data.type = 'finished';
            data.Hand = MyHand;
            SendData(data)
        }else{
            data.type = 'selected';
            data.Hand = '';
            SendData(data);
        }
    }else{
        if(buttonAlive == false){
            alert('You have already given it out Please wait for the result.');
        }else{
            alert('There is no partner.')
        }
    }


});
PaperButton.addEventListener('click',()=>{
if(buttonAlive && Object.keys(connections).length > 0){
    
    MyStatus = 'completed';
    MyHand = 'Paper';
    me.innerHTML = 'Me : Paper'
    opponent.innerHTML = 'Opponent : pending...'
    buttonAlive = false;
    if(MyStatus && OpponentStatus){
        data.type = 'finished';
        data.Hand = MyHand;
        SendData(data)
    }else{
        data.type = 'selected';
        data.Hand = '';
        SendData(data);
    }
}else{
    if(buttonAlive == false){
        alert('You have already given it out Please wait for the result.');
    }else{
        alert('There is no partner.')
    }
}
    


});

if (document.location.hash === "" || document.location.hash === undefined) { 
    // create the unique token for this call 
    token =Math.round(Math.random()*10000);
    call_token = "#"+token;

    // set location.hash to the unique token for this call
    document.location.hash = token;
    alert(`Room is created , Your Room_Number is ${token}, `)
    
}else{
    call_token = document.location.hash;
}
//--------front button (pc use)
Room_Number.innerHTML = 'Room_Number : '+ call_token.split('#')[1];






// main async function 
async function run(){
        if (!sessionStorage['accessToken']) {
           // alert('You are connected anonymously.')
            //throw new Error('cognito accessToke;n is not defined!!! please Sign In');
        }
        
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;
        localVideo.play();
        socket = io()
        socket.on('connect', function(){
            //check username
            if(sessionStorage['accessToken']!=undefined){
                let accessToken = JSON.parse(sessionStorage['accessToken']);
                myname  = accessToken.payload['cognito:username'];
            }else{
                myname = socket.id;
            }
            socketId = socket.id;
            socket.emit('token_number',call_token, myname);
            me.innerHTML = 'Me : Waitng for partner...';
            opponent.innerHTML ='Opponent : none';
        })
        socket.on('user-left', function(id){
            var video = document.getElementById(`${id}`);
            if(video != null){
                video.srcObject = null;
                opponent.innerHTML = 'Opponent : none';
            }
            Object.keys(connections).forEach(function(connection_id){
                if(connection_id == id){
                    delete connections[connection_id];
                }
            })
            //console.log(connections);
            // var parentDiv = video.parentElement;
            // video.parentElement.parentElement.removeChild(parentDiv);
        });
        socket.on('user-exceeded',function(){
            alert('user exceeded!');
            window.location.replace("index.html");
        })
        socket.on('user-joined', function(id, client_socket_ids, masterName){
            masterName_title.innerHTML = masterName + `'s session`;
            console.log(connections)
            console.log(id, client_socket_ids, masterName)
            client_socket_ids.forEach(function(client_socket_id) {
                if(socketId != client_socket_id && !connections[client_socket_id]){
                    connections[client_socket_id] = new RTCPeerConnection(peerConnectionConfig);
                  
                    //if(client_socket_ids.indexOf(client_socket_id)<client_socket_ids.indexOf(client_))
                        let channel = connections[client_socket_id].createDataChannel(`chat${client_socket_id}`)
                        connections[client_socket_id].channel = channel
                        channel.onopen = function(event) {
                            //console.log(`it is create peer`)
                            //channel.send('it is create peer');
                          }
                          /*channel.onmessage = function(event) {
                            var data = JSON.parse(event.data)
                            console.log(data)
                            document.getElementById(`${data.id}`).style.filter = data.currentFilter;
                            //if(connections[data.id])
                            }*/
                        
                        //Wait for their ice candidate       
                        connections[client_socket_id].onicecandidate = function(event){
                            if(event.candidate != null) {
                                console.log('SENDING ICE',client_socket_id);
                                socket.emit('signal', client_socket_id, JSON.stringify({'ice': event.candidate}));
                            }
                        }
                        connections[client_socket_id].ondatachannel = function(event) {
                            let channel = event.channel;
                            //connections[client_socket_id].channel = channel
                            
                            channel.onopen = function(event) {
                                  //console.log('it is receive peer')
                              //channel.send('it is receive peer');
                            }
                            channel.onmessage = function(event) {
                                var data = JSON.parse(event.data);
                                console.log(data)
                                switch(data.type){
                                    case 'selected':
                                            OpponentStatus = 'completed';
                                    break;
                                    case 'finished':
                                        if(!OpponentStatus){
                                            let result = RpsJudge(MyHand,data.Hand);
                                            opponent.innerHTML=`Opponent : ${data.Hand}`;
                                            data.type = 'finished';
                                            data.Hand = MyHand;
                                            SendData(data);
                                            ret.innerHTML = `latest result : ${result}`;
                                            alert(`You ${result}`);
                                            if(result == 'win'){
                                                count++;
                                                WinCount.innerHTML = `WinCount : ${count}`;
                                            }
                                            buttonAlive= true;
                                            MyStatus= undefined; OpponentStatus = undefined;
                                        }else{
                                            let result = RpsJudge(MyHand,data.Hand);
                                            opponent.innerHTML=`Opponent : ${data.Hand}`;
                                            ret.innerHTML = `latest result : ${result}`;
                                            alert(`You ${result}`);
                                            if(result == 'win'){
                                                count++;
                                                WinCount.innerHTML = `WinCount : ${count}`;
                                            }
                                            buttonAlive= true;
                                            MyStatus= undefined; OpponentStatus = undefined;
                                        }
                                    break;
                                }
                                
                            }
                        }
                    
                        connections[client_socket_id].ontrack = function(event){
                            gotRemoteStream(event, client_socket_id)
                        }    
                   
                        localStream.getTracks().forEach(function(track) {
                        connections[client_socket_id].addTrack(track, localStream);
                      });
                      
                }
            });

            if(socketId != id){
                connections[id].createOffer().then(function(description){
                    //console.log("before setLocalDescription")
                    connections[id].setLocalDescription(description).then(function() {
                        socket.emit('signal', id, JSON.stringify({'sdp': connections[id].localDescription}));
                    }).catch(e => console.log(e));        
                });
            }

        });
        socket.on('signal', gotMessageFromServer);
        //Check Sign in
        
}

//main function start
run().catch(err => {
            alert(`Can not start the app due to this reason: ${err}`)
            });




//function in run()
function gotMessageFromServer(fromId, message, type) {
        //Make sure it's not coming from yourself
    if(type == 'sdp'){
        if(fromId != socketId) {
            var signal = JSON.parse(message)
                if(signal.sdp){   
                    //console.log("before setRemoteDescription")
                    connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function() {                
                        if(signal.sdp.type == 'offer') {
                            connections[fromId].createAnswer().then(function(description){
                                connections[fromId].setLocalDescription(description).then(function() {
                                    socket.emit('signal', fromId, JSON.stringify({'sdp': connections[fromId].localDescription}));
                                }).catch(e => console.log(e));        
                            }).catch(e => console.log(e));
                        }else if(signal.sdp.type == 'answer'){
                           /* connections[fromId].ondatachannel = function(event) {
                                let channel = event.channel;
                                connections[fromId].channel = channel
                                  channel.onopen = function(event) {
                                      console.log('it is receive peer')
                                  //channel.send('it is receive peer');
                                }
                                channel.onmessage = function(event) {
                                    var data = JSON.parse(event.data)
                                    console.log(data)
                                    document.getElementById(`${data.id}`).style.filter = data.currentFilter;
                                }
                            }*/
                        }
                    }).catch(e => console.log(e));
                }
                if(signal.ice) {
                    if(connections[fromId]!=undefined){
                        connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e));
                    }
                }                
            }
        }
}
function gotRemoteStream(event, id) {
    if(stream_cnt==0){
        remoteVideo.setAttribute('playsinline',true);
        remoteVideo.setAttribute('id', id);
        inboundStream = new MediaStream();
        remoteVideo.srcObject = inboundStream;
        remoteVideo.autoplay    = true;  
    } 
    if (stream_cnt<2) {
        inboundStream.addTrack(event.track);
    }    
        stream_cnt++;
    if(stream_cnt == 2){
        me.innerHTML ='Me : Rock? Scissors? Paper?'
        opponent.innerHTML = 'Opponent : pending...';
        stream_cnt=0;
    }
}
function SendData(data) {
    console.log(connections)
 let connection_ids = Object.keys(connections)
    if (connection_ids.length>0) {
        connection_ids.forEach(function(connection_id){
            if(connection_id!=socketId){
            //console.log(connections[connection_id])
            connections[connection_id].channel.send(JSON.stringify(data));
            console.log(`sending ${data}`);
            }
        })
    }
}

function RpsJudge(MyHand, OpponentHand){
    switch(MyHand){
        case "Rock" :
            if(OpponentHand == "Rock"){
                return 'draw';
            }else if(OpponentHand == "Scissors"){
                return 'win';
            }else{
                return 'lose';
            }
        case "Scissors" :
                if(OpponentHand == "Scissors"){
                    return 'draw';
                }else if(OpponentHand == "Paper"){
                    return 'win';
                }else{
                    return 'lose';
                }
        case  "Paper" :
                if(OpponentHand == "Paper"){
                    return 'draw';
                }else if(OpponentHand == "Rock"){
                    return 'win';
                }else{
                    return 'lose';
                }
    }
}

},{}]},{},[1]);

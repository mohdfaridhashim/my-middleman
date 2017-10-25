var app = require('express')();
var http = require('http').Server(app);
const superagent = require('superagent');
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var serverurl = 'http://rest.digitaloneserver.com/';
//users
var users = [];
loadUSER(serverurl); //load user data from server API
app.get('/', function(req, res){
  res.send('<h1>chat engine</h1>');
});

io.on('connection', function(socket){
  console.log('socket id : '+socket.id);
  io.to(socket.id).emit('ping', "pong");
  socket.on('login',function(detail){
    superagent
       .post(serverurl+'login')
       .set('Content-Type', 'application/json')
       .send(detail)
       .end(function(err, res){
         if (err || !res.ok) {
           console.log('faik');
           io.to(socket.id).emit('login', 'invalid authentication');
         } else {
           console.log('success login');
           var detail = JSON.parse(res.text);
           var needCreate = 'f';
           if(users.length>0){
              for(var i =0; i<users.length; i++){
                 if(users[i].user_id==detail.user_id){
                  users[i].socketid = socket.id;
                  users[i].status = 'online';
                  needCreate='t';
                 }
              }
           }
           if(needCreate==='f'){
              users.push({
                'user_id': detail.user_id,
                'socketid': socket.id,
                'user_fullname':detail.user_fullname,
                'user_email':detail.user_email,
                'status':'online'
               });
            }

           console.log(users);
           io.to(socket.id).emit('login', res.text);
         }
       });
  });

  socket.on('conversation_List',function(req){
    var detailUser = JSON.parse(req);
    var conversation = [];
    superagent
       .get(serverurl+'listTalk?id='+detailUser.user_id)
       .set('Content-Type', 'application/json')
       .end(function(err, res){
          if (err || !res.ok) {
             console.log('fail conversation');
             io.to(socket.id).emit('conversation_List', 'invalid authentication');
           } else {
             console.log('success conversation');
             var detail = JSON.parse(res.text);
             var cDetail;
             var defaultValue = 'f';
             if(detail.chat.length>0){
                for(var i=0; i<detail.chat.length; i++){
                    if(detail.chat[i].detail != null){
                      console.log(i);
                      console.log(detail.chat[i].detail);
                      if(detail.chat[i].detail.msgtype =='2'){
                        var txt = '<li><a href="#" onclick="chatPage('+detailUser.user_id+','+detail.chat[i].user_id+','+detail.chat[i].c_id+');return false;" class="clearfix"><img src="https://bootdey.com/img/Content/user_2.jpg" alt="" class="img-circle"><div class="friend-name"><strong>' + detail.chat[i].user_email + '</strong></div><div class="last-message text-muted"><i class="icon-camera-retro"></i>photo</div><small class="time text-muted">' + detail.chat[i].detail.time_chat + '</small><small class="chat-alert text-muted"><i class="fa fa-check"></i></small></a></li>';
                      }else{
                        var txt = '<li><a href="#" onclick="chatPage('+detailUser.user_id+','+detail.chat[i].user_id+','+detail.chat[i].c_id+');return false;" class="clearfix"><img src="https://bootdey.com/img/Content/user_2.jpg" alt="" class="img-circle"><div class="friend-name"><strong>' + detail.chat[i].user_email + '</strong></div><div class="last-message text-muted">'+detail.chat[i].detail.reply+'</div><small class="time text-muted">' + detail.chat[i].detail.time_chat + '</small><small class="chat-alert text-muted"><i class="fa fa-check"></i></small></a></li>';
                      }
                      conversation.push(txt);
                      defaultValue = 't'; 
                    }else{
                      var txt = '<li><a href="#" onclick="chatPage('+detailUser.user_id+','+detail.chat[i].user_id+','+detail.chat[i].c_id+');return false;" class="clearfix"><img src="https://bootdey.com/img/Content/user_2.jpg" alt="" class="img-circle"><div class="friend-name"><strong>' + detail.chat[i].user_email + '</strong></div><div class="last-message text-muted"> - </div><small class="time text-muted"> - </small><small class="chat-alert text-muted"><i class="fa fa-check"></i></small></a></li>';
                      conversation.push(txt);
                      defaultValue = 't';
                    }
                }
             }

             if(defaultValue === 'f'){
                conversation.push(
                    "<li><div class='friend-name'><strong>No Conversation Found. Please search contact.</strong></div><div class='last-message text-muted'>-</div><small class='time text-muted'>-</small><small class='chat-alert text-muted'><i class='fa fa-check'></i></small></li>"
                ); 
             }
             io.to(socket.id).emit('conversation_List', conversation);
           }
        });
  });
  socket.on('newChatPage',function(msg){

  });
  socket.on('chatPage',function(cid){
      console.log(cid);
      var chatArray = [];
      var receiver;
      var receiverSocket;
      var needSend = 'f';
      var who;
      for(var i =0; i<users.length; i++){
        console.log(users[i].socketid);
        console.log(socket.id);
        if(socket.id == users[i].socketid){
          who = users[i].user_id;
          console.log('owner:'+users[i].user_id);
          break;
        }
      }
      superagent
       .get(serverurl+'showTalk?cid='+cid)
       .set('Content-Type', 'application/json')
       .end(function(err, res){
          if (err || !res.ok) {
             console.log('chat fail');
           } else {
             console.log('chat success');
             var conversationChat = JSON.parse(res.text);
             if(conversationChat.statusCODE == 1){
               if(conversationChat.detail.length>0){
                  for(var i=0; i<conversationChat.detail.length; i++){
                    if(who == conversationChat.detail[i].user_id){
                      chatArray.push('<li class="col-xs-12 col-lg-12"><span class="pull-right">'+conversationChat.detail[i].reply+'<br /><small>'+conversationChat.detail[i].user_fullname+' '+conversationChat.detail[i].time_chat+'</small></span></li>');
                    }else{
                      chatArray.push('<li class="col-xs-12 col-lg-12"><span class="pull-left">'+conversationChat.detail[i].reply+'<br /><small>'+conversationChat.detail[i].user_fullname+' '+conversationChat.detail[i].time_chat+'</small></span></li>');
                    }
                    
                  }
                  /*if(users.length>0){
                    for(var i =0; i<users.length; i++){
                       if((users[i].user_id==receiver)&&(users[i].status == 'online')){
                          receiverSocket = users[i].socketid;
                          needSend = 't';
                       }
                    }
                    if(needSend == 't'){
                      io.to(receiverSocket).emit('chatting', chatArray);
                    }
                  }*/
                  //send to sender
                  io.to(socket.id).emit('chatPage', chatArray);

               }
             }else{
              io.to(socket.id).emit('chatPage', null);
             }


           }
        });
  });

  socket.on('chatting',function(msg){
    var message = JSON.parse(msg);
    console.log(message);
    superagent
       .post(serverurl+'replytalk')
       .set('Content-Type', 'application/json')
       .send(msg)
       .end(function(err, res){
         if(err || !res.ok){
           console.log('fail');
         }else{
           console.log('success send');
           console.log
           var detail = JSON.parse(res.text);
           var needSend = 'f';
           var needSendbulk = 'f';
           var senderfullname;
           var receiverfullname;
           var groupid;
           if(users.length>0){
              for(var i =0; i<users.length; i++){
                 if((users[i].user_id==message.receiver)&&(users[i].status == 'online')){
                    receiverSocket = users[i].socketid;
                    needSend = 't';
                 }
                 if((users[i].user_id==message.receiver)&&(users[i].user_type=='2')){
                    needSendbulk = 't';
                    groupid = users[i].user_id;
                 }
                 if((users[i].user_id==message.sender)){
                  senderfullname = users[i].user_fullname;
                 }
              }
              if(needSend == 't'){
                var sendJSON = JSON.stringify({ to: senderfullname, msg: message.msg, type: 'send' });
                io.to(receiverSocket).emit('chatting', sendJSON);
              }
            }
            var youJSON = JSON.stringify({ to: 'you', msg: message.msg, type:'receive' });
            io.to(socket.id).emit('chatting', youJSON);
         }
       });
  });

  socket.on('logout',function(detail){

  });
  //end of socket
});

http.listen(port, function(){
  console.log('listening on PORT:' + port);
});

function loadUSER(serverurl){
  superagent
       .get(serverurl+'users')
       .set('Content-Type', 'application/json')
       .end(function(err, res){
          if (err || !res.ok){
             console.log('server fail');
           }else{
             console.log('server success');
             var detail = JSON.parse(res.text);
             if(detail.data.length>0){
                for(var i=0; i<detail.data.length; i++){
                    users.push({
                      'user_id': detail.data[i].user_id,
                      'socketid': '',
                      'user_fullname':detail.data[i].user_fullname,
                      'user_email':detail.data[i].user_email,
                      'status':'offline',
                      'type':detail.data[i].user_type
                     });
                }
             }

           }
        });
}

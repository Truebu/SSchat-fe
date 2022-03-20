import { Component, OnInit } from '@angular/core';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { Message } from './models/message';
import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

  private client:Client;
  connected:boolean = false;
  messages:Message[] = [];
  message:Message = new Message();

  constructor() { }

  ngOnInit(): void {
    this.client = new Client();

    this.client.webSocketFactory = () =>{
      return new SockJS("http://localhost:8080/chat-websocket");
    }

    this.client.onConnect = (frame) =>{
      console.log('Connected: ' + this.client.connected + ' : '+ frame);
      this.connected = true;

      this.client.subscribe('/chat/message', e =>{
        const message:Message = JSON.parse(e.body) as Message;
        message.date = new Date(message.date);
        console.log(message);
        message.userName = CryptoJS.AES.decrypt(message.userName, this.message.pass).toString(CryptoJS.enc.Utf8);
        if(message.text){
          message.text = CryptoJS.AES.decrypt(message.text, this.message.pass).toString(CryptoJS.enc.Utf8);
        }
        this.messages.push(message);
        
      });
      
      this.message.type = "NEW_USER";
      this.message.userName = CryptoJS.AES.encrypt(this.message.userName, this.message.pass).toString();
      this.client.publish({destination : '/app/message', body: JSON.stringify(this.message)});
      
    }
    
    this.client.onDisconnect = (frame) =>{
      console.log('Disconnected: ' + !this.client.connected + ' : '+ frame);
      this.connected = false;
    }
  }

  disconnect():void{
    this.client.deactivate();
  }
  
  connect():void{
    this.client.activate();
  }
  
  sendMessage():void{
    this.message.type = "MESSAGE";
    this.message.text = CryptoJS.AES.encrypt(this.message.text, this.message.pass).toString();
    this.client.publish({destination : '/app/message', body: JSON.stringify(this.message)});
    this.message.text = '';
  }
}
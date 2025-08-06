"use client";
import { useEffect } from "react";


//1 -> import the FirebaseRealtimeDB file
// import FirebaseRealtimeDB from "../lib/manager"
// import {firebaseConfig} from "../lib/firebase.js"
//2 -> config for that particular database
import { AssistantMessage,PersonalMessage,GroupMessage,CustomBuilder,CodeSnippet } from "@/lib/helper/ultimate";


export default function Home() {

useEffect(() => {

  //I tested all dbs at once and it works fine
/*
    const code = {
      roll : 2403142,
      language : "C",
      title : "hello world",
      description : "hurrah",
      likesCount : 0,
      comments : [],
      tags : ["hello",'hi'],
      time : "1324891009"
    };

    var cs_maintainer = new CodeSnippet(code);
    cs_maintainer.push();
    cs_maintainer.read(2403142)
    .then((res)=>{
      console.log(res)
    });

    var gc_msg = {
      roll : 2403142,
      text: "Hello",
      reactions : [],
      time:"73874332324",
      replies:[[240172,"ok"],[2403155,'oho']],
      seens: [2403142,2403155,2403172]
    }
    
    var gchelper = new GroupMessage(gc_msg);
    gchelper.push();
    
    gchelper.read().then((data)=>{
console.log(data)
    })
var msg2 = {
  sender:2403142,
  reciever:2403172,
  text:"Hello world",
  time:"45678945678",
  reactions:[],
  replies:[],
  isSeen: false
}
var pcm = new PersonalMessage(msg2);
pcm.push();
pcm.read().then((data)=>{console.log(data)});

var msg = {
  sender:61770,//for pikachu
  reciever:2403142,
  text:"ai response",
  time:"45678945678",
}
var aim = new AssistantMessage(msg);
aim.push();
aim.read().then((data)=>{console.log(data)})



var user = {roll:2403172,active:false,lastActive:5678545567,duration:6789,page:"/"}
var cb = new CustomBuilder(user,"activeTracker");
cb.push();
cb.read().then((data)=>{console.log(data)})
*/


  }, []);


  return (
    <h1>Hello</h1>
  );
}

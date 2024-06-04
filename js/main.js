import { Core } from './core.js';

const scoreUI = document.querySelector("#score")
const highscoreUI = document.querySelector("#high_score")
const timerUI = document.querySelector("#timer")
const gameTime = 60
window.onload = () =>{
    const app = new Core(function(){
        app.createGame(10, 10);
    }, scoreUI, highscoreUI, timerUI, gameTime);
};
import { Core } from './src/core.js';

//export { Core };
window.onload = () =>{
    const app = new Core(function(){
        app.createGame(10, 10);
    });
};
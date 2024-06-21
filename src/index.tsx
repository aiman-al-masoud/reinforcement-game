// import { useEffect, useRef, useState } from "react";
// import { createRoot } from 'react-dom/client';
import { Random, sleep, v } from "./utils";
import { Biden, Canvas, Hamburger, Keyboard, MonteCarlo, NoOp, Policy, Sombrero, Sprite, Stickman, Trump, Wall, World } from "./core";


// let world = new World()
//     .putSprite(new Trump({ id: 'player', pos: v(150, 30) }))
//     .putSprite(new Hamburger({ id: 'hamburger1', pos: v(350, 270), movable: false }))
//     .putSprite(new Hamburger({ id: 'hamburger2', pos: v(400, 270), movable: false }))
//     .putSprite(new Sombrero({ id: 'sombrero1', pos: v(500, 260), movable: false }))
//     .putSprite(new Hamburger({ id: 'hamburger3', pos: v(600, 270), movable: false }))
//     .putSprite(Wall.create({ id: 'wall1', rows: 2, cols: 30, pos: v(0, 300) }))

// async function mainLoop() {

//     const sleepTimeSeconds = 0.1
//     const root = document.getElementById('root')!;
//     const canvas = new Canvas(root, 1000, 600, 'rgba(0,200,300, 0.5)')

//     const keyboard = new Keyboard()

//     keyboard.addKeybinding({
//         keys: ['ArrowRight'],
//         ondown: w => w.changeSprite('player', s => s.setXVel(100)),
//         onup: w => w.changeSprite('player', s => s.setXVel(0)),
//     })

//     keyboard.addKeybinding({
//         keys: ['ArrowLeft'],
//         ondown: w => w.changeSprite('player', s => s.setXVel(-100)),
//         onup: w => w.changeSprite('player', s => s.setXVel(0)),
//     })

//     keyboard.addKeybinding({
//         keys: ['ArrowUp'],
//         ondown: w => w.changeSprite('player', s => s.setYVel(-100)),
//         onup: w => w.changeSprite('player', s => s.setXVel(0)),
//     })

//     keyboard.listenOn(canvas.canvas)

//     while (true) {

//         world = world.tick(sleepTimeSeconds)
//         world.draw(canvas)
//         await sleep(sleepTimeSeconds)
//         world = keyboard.flushTo(world)
//     }

// }

// mainLoop()





// example of simulating an episode with a random policy and playing it back
const world = new World()
.putSprite(new Trump({ id: 'player', pos: v(150, 225) }))
    .putSprite(new Hamburger({ id: 'hamburger1', pos: v(250, 270), movable: false }))
    .putSprite(new Sombrero({  id: 'sombrero1',  pos: v(50, 260), movable: false }))
    .putSprite(Wall.create({ id: 'wall1', rows: 2, cols: 30, pos: v(0, 300)}))

const epochs = 100
const dt = 1/10
const episodeSize = 100

const mc = new MonteCarlo(
    epochs,
    episodeSize , 
    dt,
    0.9, 
    world, 
    w=>(w.getSprite('player') as Stickman).getScore(), 
    'player',
    w=>w.changeSprite('player', s=>s.setXPos(Random.instance.nextRange(10, 500)))
);

mc.train()
console.log('ciao!', mc)
const policy = mc.pi;
const episode = world.generateEpisode(episodeSize, dt, policy, new NoOp());

const root = document.getElementById('root')!;
const canvas = new Canvas(root, 1000, 600, 'rgba(0,200,300, 0.5)');

episode.playback(canvas, dt)

// (async ()=>{
    

//     for (const e of mc.savedEpisodes){
//         await e.playback(canvas, dt)
//     }
// })()

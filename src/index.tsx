import { useEffect, useRef, useState } from "react";
import { Biden, Canvas, Hamburger, Keyboard, NoOp, Policy, Sombrero, Trump, Wall, World } from "./core";
import { sleep, v } from "./utils";
import { createRoot } from 'react-dom/client';



type Mode = 'MAIN_MENU' | 'PLAY' | 'WORLD_BUILDER' | 'WORLD_MANAGER' | 'TRAIN' | 'REPLAY'


function App() {

    const [mode, setMode] = useState<Mode>('MAIN_MENU')

    switch (mode) {
        case 'MAIN_MENU':
            return <MainMenu setMode={setMode} />
        case 'PLAY':
            return <Play />
        case 'REPLAY':
            return <Replay />
        case 'TRAIN':
            return <Train />
        case 'WORLD_BUILDER':
            return <WorldBuilder />
        case 'WORLD_MANAGER':
            return <WorldManager />
    }

}

function MainMenu({ setMode }: { setMode: (mode: Mode) => void }) {
    return <>
        <h1>Main Menu</h1>
        <button onClick={() => setMode('PLAY')}>Play</button>
        <button onClick={() => setMode('WORLD_BUILDER')}>World Builder</button>
        <button onClick={() => setMode('WORLD_MANAGER')}>World Manager</button>
        <button onClick={() => setMode('TRAIN')}>Train</button>
        <button onClick={() => setMode('REPLAY')}>Replay</button>
    </>
}

function Play() {

    const canvasRef = useRef(null)

    const element = <>
        <h1>Play</h1>
        <canvas ref={canvasRef} />
    </>

    useEffect(() => {
        mainLoop(canvasRef.current!)
    }, [])

    return element
}

function Replay() {
    return <></>
}

function Train() {
    return <></>
}

function WorldManager() {
    return <></>
}

function WorldBuilder() {

    // const [title, setTitle] = useState('New World')
    // const [content, setContent] = useState('')


    // return <>
    //     <input type='text' onInput={e=>setTitle(e.target.value)}>{title}</input>
    //     <textarea cols={100} rows={20} onKeyDown={e=>{ if (e.key==='s'&&e.ctrlKey) {
    //         e.preventDefault()
    //         localStorage.setItem(title, content)
    //     } }}  onInput={e=>setContent(e.target.value)} value={content} ></textarea>
    // </>

    const canvasRef = useRef(null)
    const [spriteType, setSpriteType] = useState('trump')

    const div = <>
        <select onChange={e=>setSpriteType(e.target.value)}>
            <option value="trump">trump</option>
            <option value="biden">biden</option>
        </select>
        <canvas ref={canvasRef} ></canvas>
    </>

    useEffect(() => {

        let world = new World()
        const canvas = new Canvas(canvasRef.current!, 1000, 600, 'rgba(0,200,300, 0.5)')
        world.draw(canvas)
        canvas.canvas.onclick = e=>{

            const pos = v(e.clientX,e.clientY)
            const sprite = spriteType==='trump' ? new Trump({id:'trump', pos}) : new Biden({id:'biden', pos})
            world = world.putSprite(sprite)
            world.draw(canvas)
        }
    })

    return div
}






const container = document.getElementById('root')
const root = createRoot(container!)
root.render(<App />)




let world = new World()
    .putSprite(new Trump({ id: 'player', pos: v(150, 30) }))
    .putSprite(new Hamburger({ id: 'hamburger1', pos: v(350, 270), movable: false }))
    .putSprite(new Hamburger({ id: 'hamburger2', pos: v(400, 270), movable: false }))
    .putSprite(new Sombrero({ id: 'sombrero1', pos: v(500, 260), movable: false }))
    .putSprite(new Hamburger({ id: 'hamburger3', pos: v(600, 270), movable: false }))
    .putSprite(Wall.create({ id: 'wall1', rows: 2, cols: 30, pos: v(0, 300) }))

async function mainLoop(htmlCanvas: HTMLCanvasElement) {

    const sleepTimeSeconds = 0.1
    const root = document.getElementById('root')!;
    root.appendChild(htmlCanvas)
    const canvas = new Canvas(htmlCanvas, 1000, 600, 'rgba(0,200,300, 0.5)')

    const keyboard = new Keyboard()

    keyboard.addKeybinding({
        keys: ['ArrowRight'],
        ondown: w => w.changeSprite('player', s => s.setXVel(100)),
        onup: w => w.changeSprite('player', s => s.setXVel(0)),
    })

    keyboard.addKeybinding({
        keys: ['ArrowLeft'],
        ondown: w => w.changeSprite('player', s => s.setXVel(-100)),
        onup: w => w.changeSprite('player', s => s.setXVel(0)),
    })

    keyboard.addKeybinding({
        keys: ['ArrowUp'],
        ondown: w => w.changeSprite('player', s => s.setYVel(-100)),
        onup: w => w.changeSprite('player', s => s.setXVel(0)),
    })

    keyboard.listenOn(canvas.canvas)


    while (true) {

        world = world.tick(sleepTimeSeconds)
        world.draw(canvas)
        await sleep(sleepTimeSeconds)
        world = keyboard.flushTo(world)
    }

}




// // example of simulating an episode with a random policy and playing it back
// let world = new World()
//     .putSprite(new Trump({ id: 'player', pos: v(150, 200) }))
//     .putSprite(new Hamburger({ id: 'hamburger1', pos: v(350, 270), movable: false }))
//     .putSprite(new Hamburger({ id: 'hamburger2', pos: v(400, 270), movable: false }))
//     .putSprite(new Sombrero({  id: 'sombrero1',  pos: v(500, 260), movable: false }))
//     .putSprite(new Hamburger({ id: 'hamburger3', pos: v(600, 270), movable: false }))
//     .putSprite(Wall.create({ id: 'wall1', rows: 2, cols: 30, pos: v(0, 300)}))

// const dt = 1/10
// const episode = world.simulateEpisode(30, dt, new Policy('player'), new NoOp())
// const root = document.getElementById('root')!;
// const canvas = new Canvas(root, 1000, 600, 'rgba(0,200,300, 0.5)')
// episode.playback(canvas, dt)


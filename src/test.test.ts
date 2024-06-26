import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { expect, test } from 'bun:test'
import { World, Trump, Hamburger, Wall, Sprite, Policy, NoOp, NoOpPolicy, MonteCarlo, Stickman, Sombrero } from './core'
import { Random, v } from './utils'
GlobalRegistrator.register()

test('move and eat burger test', () => {

    const burgerPosition = v(350, 270)
    const playerPosition = v(150, 30)

    let world = new World()
        .putSprite(new Trump({ id: 'player', pos: playerPosition }))
        .putSprite(new Hamburger({ id: 'hamburger1', pos: burgerPosition, movable: false }))
        .putSprite(Wall.create({ id: 'wall1', rows: 2, cols: 30, pos: v(0, 300) }))

    world = world.changeSprite('player', s => s.setXVel(100))

    const playerBefore = world.getSprite('player') as Trump
    const pos1 = playerBefore.getPos()
    const score1 = playerBefore.getScore()

    world = world.generateEpisode(40, 1 / 10, new NoOpPolicy('player'), new NoOp()).present

    const playerAfter = world.getSprite('player') as Trump
    const pos2 = playerAfter.getPos()
    const score2 = playerAfter.getScore()

    expect(score2).toBeGreaterThan(score1)
    expect(pos2.x).toBeGreaterThan(pos1.x)
})




// test('monte carlo', () => {

//     const burgerPosition = v(350, 270)
//     const playerPosition = v(150, 30)

//     const world = new World()
//         .putSprite(new Trump({ id: 'player', pos: playerPosition }))
//         .putSprite(new Hamburger({ id: 'hamburger1', pos: burgerPosition, movable: false }))
//         .putSprite(Wall.create({ id: 'wall1', rows: 2, cols: 30, pos: v(0, 300) }))

//     function getReward(world: World) {

//         const player = world.getSprite('player') as Stickman
//         return player.getScore()
//     }

//     const mc = new MonteCarlo(100, 30, 1/10, 0.3, world, getReward, 'player')
//     mc.train()
//     const { pi } = mc
//     console.log(pi)
// })




test('monte carlo', () => {

    // example of simulating an episode with a random policy and playing it back
    let world = new World()
        .putSprite(new Trump({ id: 'player', pos: v(150, 225) }))
        .putSprite(new Hamburger({ id: 'hamburger1', pos: v(250, 270), movable: false }))
        .putSprite(new Sombrero({  id: 'sombrero1',  pos: v(50, 260), movable: false }))
        .putSprite(Wall.create({ id: 'wall1', rows: 2, cols: 30, pos: v(0, 300)}))

    const epochs = 1000
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
    )
    
    mc.train()
    const policy = mc.pi

    function testMultiple(policy:Policy){

        const episodes = 100

        let avrg = 0

        for(let i=0;i<episodes;i++){
            const episode = world.generateEpisode(episodeSize, dt, policy, new NoOp())
            const score = (episode.present.getSprite('player') as Stickman).getScore()
            // console.log(score)
            avrg += score
        }

        return avrg/episodes
    }

    console.log(testMultiple(policy))

})



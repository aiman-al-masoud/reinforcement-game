import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { expect, test } from 'bun:test'
import { World, Trump, Hamburger, Wall, Sprite, Policy, NoOp, NoOpPolicy, MonteCarlo, Stickman } from './core'
import { v } from './utils'
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




test('monte carlo', () => {

    const burgerPosition = v(350, 270)
    const playerPosition = v(150, 30)

    const world = new World()
        .putSprite(new Trump({ id: 'player', pos: playerPosition }))
        .putSprite(new Hamburger({ id: 'hamburger1', pos: burgerPosition, movable: false }))
        .putSprite(Wall.create({ id: 'wall1', rows: 2, cols: 30, pos: v(0, 300) }))

    function getReward(world: World) {

        const player = world.getSprite('player') as Stickman
        return player.getScore()
    }

    const mc = new MonteCarlo(100, 30, 1/10, 0.3, world, getReward, 'player')
    mc.train()
    const { pi } = mc
    console.log(pi)
})



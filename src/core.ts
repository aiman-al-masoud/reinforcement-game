import { Vector, type KeyName, v, Random, sleep } from "./utils"
import { R } from "../res/R"




export class World {

    constructor(readonly sprites: Sprite[] = []) {

    }

    changeSprite(id: string, map: (sprite: Sprite) => Sprite) {

        const mutandum = this.getSprite(id)
        const mutatum = map(mutandum)
        return this.putSprite(mutatum)
    }

    putSprite(sprite: Sprite): World {
        return this.removeSprite(sprite.getId()).addSprite(sprite)
    }

    protected addSprite(sprite: Sprite): World {
        return new World(this.sprites.concat(sprite))
    }

    removeSprite(id: string): World {

        const toBeKept = this.sprites.filter(sprite => sprite.getId() !== id)
        return new World(toBeKept)
    }

    getSprite(id: string) {

        const sprite = this.sprites.filter(sprite => sprite.getId() === id).at(0)

        if (!sprite) {
            throw new Error('No such sprite!')
        }

        return sprite
    }

    hasSprite(id: string): boolean {

        const sprite = this.sprites.filter(sprite => sprite.getId() === id).at(0)
        return !!sprite
    }

    tick(dt: number): World {

        return this
            .tickGravity(dt)      // first "decrease" y-velocity
            .tickCollisions(dt)   // then set y-vel to zero if there is a collision
            .tickPosition(dt)     // finally, move the sprites accoring to their velocity
    }

    /**
     * Generate an episode from an initial state (this world), a policy and an initial action.
     */
    generateEpisode(ticks: number, dt: number, policy: Policy, a0: Action) {

        let action = a0
        let episode = new Episode([[this, a0]])

        for (let i = 0; i < ticks; i++) {

            episode = episode.extend(episode.present.tick(dt), new NoOp())
            episode = episode.extend(action.perform(episode.present), action)
            action = policy.getAction(episode.present.toHash())
        }

        return episode
    }

    tickGravity(dt: number): World {

        const g = v(0, 100)
        const dv = g.times(dt)
        const sprites = this.sprites.map(sprite => sprite.accelerate(dv))
        return new World(sprites)
    }

    tickPosition(dt: number): World {

        const sprites = this.sprites.map(sprite => sprite.move(dt))
        return new World(sprites)
    }

    tickCollisions(dt: number): World {

        let newWorld: World = this
        const spriteIds = this.sprites.map(s => s.getId())

        for (let i = 0; i < spriteIds.length; i++) {
            for (let j = i + 1; j < spriteIds.length; j++) {

                const id1 = spriteIds[i]!
                const id2 = spriteIds[j]!

                if (!newWorld.hasSprite(id1) || !newWorld.hasSprite(id2)) {
                    continue
                }

                const s1 = newWorld.getSprite(id1)
                const s2 = newWorld.getSprite(id2)

                if (!s1.isCollidingWith(s2)) {
                    var s1New = s1.exitCollision(s2)
                    var s2New = s2.exitCollision(s1)
                } else {
                    var s1New = s1.enterCollision(s2)
                    var s2New = s2.enterCollision(s1)
                }

                if (s1New) {
                    newWorld = newWorld.putSprite(s1New)
                }

                if (s2New) {
                    newWorld = newWorld.putSprite(s2New)
                }

                if (!s1New) {
                    newWorld = newWorld.removeSprite(s1.getId())
                }

                if (!s2New) {
                    newWorld = newWorld.removeSprite(s2.getId())
                }
            }
        }

        return newWorld
    }

    draw(canvas: Canvas) {

        canvas.clear()
        this.sprites.forEach(sprite => sprite.draw(canvas))
        canvas.drawHud(this.toHash().split(';'))
    }

    /**
     * Quantizes the state and returns a string representation.
     */
    toHash(): string {
        return this.sprites.map(s => s.toHash()).join(';')
    }
}

type SpriteData = {
    readonly id: string
    readonly vel: Vector
    readonly movable: boolean
    readonly colliding: boolean
}


export class Sprite {

    readonly data: SpriteData

    constructor(data: Partial<SpriteData> & { id: string }) {
        this.data = {
            vel: v(0, 0),
            movable: true,
            colliding: false,
            ...data
        }
    }

    setXVel(x: number) {
        return this.copy({ vel: v(x, this.data.vel.y) })
    }

    isColliding() {
        return this.data.colliding
    }

    setYVel(y: number) {

        if (!this.isColliding() && y < 0) { // jumps cannot start while in in mid-air 
            return this
        }

        return this.copy({ vel: v(this.data.vel.x, y) })
    }

    setVel(x: number, y: number): Sprite {
        return this.setXVel(x).setYVel(y)
    }

    getId(): string {
        return this.data.id
    }

    getPos(): Vector {
        throw new Error(this.constructor.name)
    }

    getLeftX(): number {
        throw new Error()
    }

    getTopY(): number {
        throw new Error()
    }

    getRightX() {
        return this.getLeftX() + this.getWidth()
    }

    getBottomY() {
        return this.getTopY() + this.getHeight()
    }

    getWidth(): number {
        throw new Error()
    }

    getHeight(): number {
        throw new Error()
    }

    isFalling() {
        return this.getVel().y > 0
    }

    isMovable(): boolean {
        return this.data.movable
    }

    getVel(): Vector {
        return this.data.vel
    }

    isFacingLeft(): boolean {
        return this.getVel().x < 0
    }

    copy(args: any/* Partial<typeof this.data> */): this {

        const clazz = this.constructor as any
        return new clazz({ ...this.data, ...args })
    }

    accelerate(deltaV: Vector): Sprite {
        throw new Error()
    }

    move(dt: number): this {
        throw new Error()
    }

    draw(canvas: Canvas) {
        throw new Error('unimplemented')
    }

    isCollidingWith(other: Sprite): boolean {

        // Is the RIGHT edge of r1 to the RIGHT of the LEFT edge of r2?
        return this.getRightX() >= other.getLeftX() &&
            // Is the LEFT edge of r1 to the LEFT of the RIGHT edge of r2?
            this.getLeftX() <= other.getRightX() &&
            // Is the BOTTOM edge of r1 BELOW the TOP edge of r2?
            this.getBottomY() >= other.getTopY() &&
            // Is the TOP edge of r1 ABOVE the BOTTOM edge of r2?
            this.getTopY() <= other.getBottomY()
    }

    enterCollision(other: Sprite): this | undefined {

        let sprite = this.isFalling() ? this.setYVel(0) : this
        sprite = sprite.copy({ colliding: true })
        return sprite
    }

    exitCollision(other: Sprite): this | undefined {
        return this.copy({ colliding: false })
    }

    /**
     * Quantizes the state and returns a string representation.
     */
    toHash(): string {

        const quantizedPos = this.getPos().over(100).toInt().times(100)
        return `id=${this.getId()},pos=${quantizedPos},colliding=${this.data.colliding}`
    }
}

type ImageData = {
    base64: string,
    width: number,
    height: number,
}

type SingleSpriteData = SpriteData & {
    /** position of top-left rectangle edge */
    readonly pos: Vector
    /** factor by which image width/height are scaled */
    readonly scale: number
    readonly image: ImageData
}

export class SingleSprite extends Sprite {

    declare readonly data: SingleSpriteData

    constructor(data: Partial<SingleSpriteData> & { id: string, pos: Vector }) {

        super({
            scale: 1,
            ...data
        })

    }

    draw(canvas: Canvas) {

        canvas.drawImage({
            imageBase64: this.data.image.base64,
            pos: this.data.pos.toInt(),
            flipHorizontal: this.isFacingLeft(),
            scale: this.data.scale,
        })
    }

    getLeftX(): number {
        return this.data.pos.x
    }

    getTopY(): number {
        return this.data.pos.y
    }

    getWidth() {
        return this.data.image.width * this.data.scale
    }

    getHeight() {
        return this.data.image.height * this.data.scale
    }

    getPos(): Vector {
        return this.data.pos
    }

    move(dt: number) {

        if (!this.isMovable()) {
            return this
        }

        const deltaPos = this.getVel().times(dt)
        const currPos = this.data.pos
        const pos = currPos.plus(deltaPos)
        return this.copy({ pos })
    }

    accelerate(deltaV: Vector): Sprite {
        return this.copy({ vel: this.getVel().plus(deltaV) })
    }
}

type StickmanData = SingleSpriteData & {
    readonly score: number,
}

export class Stickman extends SingleSprite {

    declare readonly data: StickmanData

    constructor(data: Partial<StickmanData> & { id: string, pos: Vector }) {

        super({
            image: R['stickman.png'],
            score: 0,
            ...data,
        })
    }

    setScore(score: number) {
        return this.copy({ score })
    }

    getScore(): number {
        return this.data.score
    }

    increaseScore(deltaScore: number) {
        return this.setScore(this.data.score + deltaScore)
    }

    decreaseScore(deltaScore: number) {
        return this.increaseScore(-deltaScore)
    }

    toHash(): string {
        return super.toHash() + `,score=${this.getScore()}`
    }

}

export class Trump extends Stickman {

    constructor(data: Partial<StickmanData> & { id: string, pos: Vector }) {

        super({
            image: R['trump-small.png'],
            ...data,
        })
    }

    enterCollision(other: Sprite): this | undefined {

        const sprite = super.enterCollision(other)

        if (!sprite) {
            return sprite
        }

        if (other instanceof Hamburger) {
            return sprite.increaseScore(5)
        }

        if (other instanceof Sombrero) {
            return sprite.decreaseScore(1)
        }

        return sprite
    }
}


export class Biden extends Stickman {

    constructor(data: Partial<StickmanData> & { id: string, pos: Vector }) {

        super({
            image: R['biden-small.png'],
            ...data,
        })
    }
}


export class Food extends SingleSprite {

    enterCollision(other: Sprite): this | undefined {

        const sprite = super.enterCollision(other)

        if (other instanceof Stickman) {
            return undefined
        }

        return sprite
    }

}

export class IceCream extends Food {

    constructor(data: Partial<SingleSpriteData> & { id: string, pos: Vector }) {

        super({
            vel: v(0, 0),
            movable: false,
            image: R['ice-cream-small.png'],
            ...data,
        })
    }

}


export class Sombrero extends Food {

    constructor(data: Partial<SingleSpriteData> & { id: string, pos: Vector }) {

        super({
            vel: v(0, 0),
            movable: false,
            image: R['sombrero-small.png'],
            ...data,
        })
    }

}


export class Hamburger extends Food {

    constructor(data: Partial<SingleSpriteData> & { id: string, pos: Vector }) {

        super({
            vel: v(0, 0),
            movable: false,
            image: R["hamburger-small.png"],
            ...data,
        })
    }

}

export class Brick extends SingleSprite {

    constructor(data: Partial<SingleSpriteData> & { pos: Vector }) {

        super({
            id: Random.instance.nextInt() + '',
            vel: v(0, 0),
            movable: false,
            image: R['brick-small.png'],
            ...data,
        })
    }
}


export class MultiSprite extends Sprite {

    declare readonly data: SpriteData & { elements: Sprite[], rows: number, cols: number }

    protected constructor(data: Partial<SpriteData> & { id: string, elements: Sprite[], rows: number, cols: number }) {
        super(data)
    }

    draw(canvas: Canvas): void {
        this.data.elements.forEach(element => element.draw(canvas))
    }

    move(dt: number): this {

        const elements = this.data.elements.map(element => element.move(dt))
        return this.copy({ elements })
    }

    accelerate(deltaV: Vector): Sprite {

        const elements = this.data.elements.map(element => element.accelerate(deltaV))
        return this.copy({ elements })
    }

    static byGrid(data: Partial<SpriteData> & { id: string, rows: number, cols: number, element: Sprite }) {

        const { rows, cols, element, id, movable = true } = data
        const elements = []
        const topLeftPos = element.getPos()
        let pos = topLeftPos

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const brick = element.copy({ id: Math.random(), pos, movable })
                elements.push(brick)
                pos = pos.plus(v(element.getWidth(), 0))
            }
            pos = v(topLeftPos.x, pos.y + element.getHeight())
        }

        return new MultiSprite({ elements, id, rows, cols, movable })
    }

    /**
     * Assumes first element of list is topomost-leftmost
     */
    getPos(): Vector {
        return this.data.elements.at(0)!.getPos()
    }

    /**
     * Assumes first element of list is leftmost.
     */
    getLeftX(): number {
        return this.getPos().x
    }

    /**
     * Assumes first element of list is topmost.
     */
    getTopY(): number {
        return this.getPos().y
    }

    /**
    * Assumes all elements have the same width.
    */
    getWidth(): number {
        return this.data.elements.at(0)!.getWidth() * this.data.cols
    }

    /**
    * Assumes all elements have the same height. 
    */
    getHeight(): number {
        return this.data.elements.at(0)!.getHeight() * this.data.rows
    }
}

export class Wall extends MultiSprite {

    static create({ id, rows, cols, pos }: { id: string, rows: number, cols: number, pos: Vector }) {
        return MultiSprite.byGrid({ id, rows, cols, movable: false, element: new Brick({ pos }) })
    }
}


export class Canvas {

    readonly canvas: HTMLCanvasElement
    readonly ctx: CanvasRenderingContext2D

    constructor(/* root: HTMLElement, */ canvas:HTMLCanvasElement,  width: number, height: number, background: string) {

        this.canvas = canvas
        // this.canvas = document.createElement('canvas')
        this.canvas.width = width
        this.canvas.height = height
        this.canvas.style.background = background
        // root.innerHTML = ''
        // root.appendChild(this.canvas)
        this.ctx = this.canvas.getContext('2d')!
    }

    clear() {

        const { width, height } = this.canvas
        this.ctx.clearRect(0, 0, width, height)
    }

    drawHud(texts: string[]) {

        const hudSize = v(300, 200)
        const hudPos = v(this.canvas.width - hudSize.x, 0)
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
        this.ctx.fillRect(hudPos.x, hudPos.y, hudSize.x, hudSize.y)
        this.ctx.fillStyle = 'white'
        const lineSpacing = 20
        this.ctx.font = '15px sans'
        const margin = '   '

        texts.forEach((line, i) => {
            this.ctx.fillText(margin + line + margin, hudPos.x, hudPos.y + (i + 1) * lineSpacing, hudSize.x)
        })
    }

    drawImage(opts: { imageBase64: string, pos: Vector, flipHorizontal?: boolean, scale?: number }) {

        const { imageBase64, pos, flipHorizontal = false, scale = 1 } = opts
        const image = new Image()
        image.src = imageBase64
        const tmpCanvas = document.createElement('canvas')
        const tmpCanvasCtx = tmpCanvas.getContext('2d')!
        tmpCanvasCtx.clearRect(0, 0, tmpCanvas.width, tmpCanvas.height)
        tmpCanvasCtx.save();
        tmpCanvasCtx.scale(flipHorizontal ? -scale : scale, scale);
        tmpCanvasCtx.drawImage(image, opts.flipHorizontal ? image.width * -1 : 0, 0, image.width, image.height);
        tmpCanvasCtx.restore();
        this.ctx.drawImage(tmpCanvas, pos.x, pos.y)
    }

}

type Keybinding = {
    readonly keys: KeyName[],
    readonly ondown: (state: World) => World,
    readonly onup: (state: World) => World,
}

export class Keyboard {

    readonly keyIsDown: { [key: string]: 'up' | 'down' | 'nothing' } = {}
    readonly bindings: Keybinding[] = []

    listenOn(element: HTMLElement) {

        element.tabIndex = 1
        element.focus()
        element.onkeydown = this.onkeydown
        element.onkeyup = this.onkeyup
    }

    flushTo(state: World): World {

        return this.bindings.reduce((s, binding) => {

            if (this.areDown(binding.keys)) {
                return binding.ondown(s)
            } else if (this.areUp(binding.keys)) {
                this.resetKeys(binding.keys)
                return binding.onup(s)
            } else {
                return s
            }

        }, state)
    }

    onkeydown = (e: KeyboardEvent) => {
        this.keyIsDown[e.key] = 'down'
    }

    onkeyup = (e: KeyboardEvent) => {
        this.keyIsDown[e.key] = 'up'
    }

    resetKeys(keys: KeyName[]) {
        keys.forEach(k => this.keyIsDown[k] = 'nothing')
    }

    addKeybinding(keybinding: Keybinding) {
        this.bindings.push(keybinding)
    }

    areDown(keys: KeyName[]) {
        return keys.every(k => this.keyIsDown[k] === 'down')
    }

    areUp(keys: KeyName[]) {
        return keys.every(k => this.keyIsDown[k] === 'up')
    }

}






// TODO: pre-render un-movable objects on another canvas
// https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas



// actions: just one action at a time
// four actions:
// setXVel(100), setXVel(-100), setYVel(-100), setVel(v(0,0))
// assume all actions are possible all the time
// given a world.toHash() choose one of these actions as the optimal one learned from interaction with a game-level.
// the length of an episode can be defined as the number of ticks.



// -------------------------------------------------------------------------------------------

export class Policy {

    constructor(
        readonly actorId: string,
        readonly stateHashToAction: { [stateHash: string]: Action } = {},
    ) {

    }

    getAction(stateHash: string): Action {
        return this.stateHashToAction[stateHash] ?? this.getRandomAction()
    }

    setAction(state: World, action: Action) {
        this.stateHashToAction[state.toHash()] = action
    }

    getRandomAction() {

        const actions = this.getActions()
        return Random.instance.nextChoice(actions)!
    }

    protected getActions() {

        return [
            new MoveLeft(this.actorId),
            new MoveRight(this.actorId),
            new MoveUp(this.actorId),
            new Stop(this.actorId),
        ]
    }

}

export class Action {

    constructor(readonly actorId: string) {

    }

    perform(state: World): World {
        throw new Error()
    }

    toHash() {
        return `(actorId=${this.actorId},type=${this.constructor.name})`
    }
}

export class MoveUp extends Action {

    perform(state: World): World {
        return state.changeSprite(this.actorId, s => s.setYVel(-100))
    }

}

export class MoveRight extends Action {

    perform(state: World): World {
        return state.changeSprite(this.actorId, s => s.setXVel(100))
    }
}

export class MoveLeft extends Action {

    perform(state: World): World {
        return state.changeSprite(this.actorId, s => s.setXVel(-100))
    }
}

export class Stop extends Action {

    perform(state: World): World {
        return state.changeSprite(this.actorId, s => s.setVel(0, 0))
    }
}

export class NoOp extends Action {

    constructor() {
        super('doesnotmatternoopidontcare')
    }

    perform(state: World): World {
        return state
    }
}

export class NoOpPolicy extends Policy {

    getAction(stateHash: string): Action {
        return new NoOp()
    }
}

export class Episode {

    constructor(readonly history: [World, Action][] = []) {

    }

    extend(world: World, action: Action): Episode {
        return new Episode([...this.history, [world, action]])
    }

    get present() {
        return this.worldAt(-1)
    }

    async playback(canvas: Canvas, dt: number) {

        for (const [world, _] of this.history) {

            world.draw(canvas)
            await sleep(dt)
        }
    }

    at(time: number) {
        return this.history.at(time)!
    }

    worldAt(time: number) {
        return this.at(time)[0]
    }

    actionAt(time: number) {
        return this.at(time)[1]
    }

}



export class Value {

    readonly s2a2r: { [state: string]: { [action: string]: number[] } } = {}
    readonly getActionByHash: { [action: string]: Action } = {}

    update(state: World, action: Action, g: number) {

        const stateHash = state.toHash()
        const actionHash = action.toHash()

        if (!this.s2a2r[stateHash]) {
            this.s2a2r[stateHash] = {}
        }

        if (!this.s2a2r[stateHash]![actionHash]) {
            this.s2a2r[stateHash]![actionHash] = []
            this.getActionByHash[actionHash] = action
        }

        this.s2a2r[stateHash]![actionHash]!.push(g)
    }

    getBestAction(state: World): Action {

        const actionReturnsPairs = Object.entries(this.s2a2r[state.toHash()]!)
        const actionValuePairs = actionReturnsPairs.map(x => [x[0], sum(x[1]) / Math.max(1, x[1].length)] as const)
        const [ah, _] = actionValuePairs.toSorted((a, b) => a[1] - b[1]).at(0)!
        return this.getActionByHash[ah]!
    }

}


function sum(numbers: number[]) {
    return numbers.reduce((a, b) => a + b, 0)
}

export class MonteCarlo {

    readonly pi: Policy

    constructor(

        /**
         * Number of epochs basically.
         */
        readonly episodes: number,

        /**
         * Number of world-model ticks per episode.
         */
        readonly episodeLengthInTicks: number,

        /**
         * Duration of a tick (influences "tempo" of sprites).
         */
        readonly episodeDt: number,

        /**
         * Higher gamma -> more value to future events -> lower myopia.
         */
        readonly gamma: number,
        readonly world: World,
        readonly getReward: (world: World) => number,
        readonly actorId: string,
    ) {

        this.pi = new Policy(actorId)
    }

    train() {

        for (let i = 0; i < this.episodes; i++) {
            this.trainOneEpisode()
        }
    }

    protected trainOneEpisode() {

        const s0 = this.world // TODO: randomize position of player
        const a0 = this.pi.getRandomAction()
        const episode = s0.generateEpisode(this.episodeLengthInTicks, this.episodeDt, this.pi, a0)
        const q = new Value()
        let g = 0

        for (let t = episode.history.length - 1; t > 0; t--) {

            g = this.gamma * g + this.getReward(episode.worldAt(t))
            let [s, a] = episode.at(t - 1)
            q.update(s, a, g)
            this.pi.setAction(s, q.getBestAction(s))
        }
    }

}



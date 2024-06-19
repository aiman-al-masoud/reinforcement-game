export function sleep(seconds: number) {

	return new Promise((resolve, reject) => {
		setTimeout(() => resolve(true), seconds * 1000)
	})
}

export class Random {

	protected readonly m = 0x80000000; // 2**31;
	protected readonly a = 1103515245;
	protected readonly c = 12345;
	protected state: number
	protected static _instance: Random = new Random(Math.random())

	constructor(seed: number) {
		this.state = seed
	}

	nextInt() {
		this.state = (this.a * this.state + this.c) % this.m
		return this.state
	}

	nextFloat() {
		return this.nextInt() / (this.m - 1);
	}

	nextRange(start: number, end: number) {
		const rangeSize = end - start;
		const randomUnder1 = this.nextInt() / this.m;
		return start + Math.floor(randomUnder1 * rangeSize);
	}

	nextChoice<T>(array: T[]): T | undefined {
		return array[this.nextRange(0, array.length)]!;
	}

	static setSeed(seed: number) {
		this._instance = new Random(seed)
	}

	static get instance() {
		return this._instance
	}

}


export class Vector {

	constructor(readonly x: number, readonly y: number) {

	}

	/**
	 * Euclidean Norm.
	 */
	norm() {
		return Math.sqrt(this.x ** 2 + this.y ** 2)
	}

	/** 
	 * Euclidean Distance.
	 */
	distanceTo(other: Vector) {
		const distance = ((this.x - other.x) ** 2 + (this.y - other.y) ** 2) ** 0.5
		return distance
	}

	/**
	 * https://stackoverflow.com/questions/722073/how-do-you-normalize-a-zero-vector
	 */
	unit() {
		if (this.norm() === 0) {
			return Vector.zero()//new Vector(0, 0)
		}

		return new Vector(
			this.x / this.norm(),
			this.y / this.norm(),
		)
	}

	times(scalar: number) {
		return new Vector(
			this.x * scalar,
			this.y * scalar,
		)
	}

	plus(other: Vector) {
		return new Vector(
			this.x + other.x,
			this.y + other.y,
		)
	}

	minus(other: Vector) {
		return this.plus(other.times(-1))
	}

	over(scalar: number) {
		return this.times(1 / scalar)
	}

	toString() {
		return `v[${this.x.toFixed(2)}, ${this.y.toFixed(2)}]`
	}

    toInt(){
        return new Vector(~~this.x, ~~this.y)
    }

	dot(other: Vector) {
		return this.x * other.x + this.y * other.y
	}

	static zero() {
		return new Vector(0, 0)
	}

}


export function v(x:number, y:number){
	return new Vector(x, y)
}

export const keyNames = {
    'a': 'a',
    'b': 'b',
    'c': 'c',
    'd': 'd',
    'e': 'e',
    'f': 'f',
    'g': 'g',
    'h': 'h',
    'i': 'i',
    'j': 'j',
    'k': 'k',
    'l': 'l',
    'm': 'm',
    'n': 'n',
    'o': 'o',
    'p': 'p',
    'q': 'q',
    'r': 'r',
    's': 's',
    't': 't',
    'u': 'u',
    'v': 'v',
    'w': 'w',
    'x': 'x',
    'y': 'y',
    'z': 'z',
    '0': '0',
    '1': '1',
    '2': '2',
    '3': '3',
    '4': '4',
    '5': '5',
    '6': '6',
    '7': '7',
    '8': '8',
    '9': '9',
    'ArrowLeft': 'ArrowLeft',
    'ArrowRight': 'ArrowRight',
    'ArrowUp': 'ArrowUp',
    'ArrowDown': 'ArrowDown',
    'Escape': 'Escape',
    'Enter': 'Enter',
    'Tab': 'Tab',
    'Backspace': 'Backspace',
    'Delete': 'Delete',
    'Shift': 'Shift',
    'Ctrl': 'Ctrl',
    'Alt': 'Alt',
    'CapsLock': 'CapsLock',
    ' ': ' ',
    'PageUp': 'PageUp',
    'PageDown': 'PageDown',
    'Home': 'Home',
    'End': 'End',
    'Insert': 'Insert',
    'F1': 'F1',
    'F2': 'F2',
    'F3': 'F3',
    'F4': 'F4',
    'F5': 'F5',
    'F6': 'F6',
    'F7': 'F7',
    'F8': 'F8',
    'F9': 'F9',
    'F10': 'F10',
    'F11': 'F11',
    'F12': 'F12',
    '-': '-',
    '=': '=',
    '[': '[',
    ']': ']',
    '\\': '\\',
    '/': '/',
    ';': ';',
    '\'': '\'',
    ',': ',',
    '.': '.',
    '_': '_',
    '+': '+',
    '{': '{',
    '}': '}',
    '<': '<',
    '>': '>',
    '?': '?',
    '~': '~',
    '|': '|',
    '!': '!',
    '@': '@',
    '#': '#',
    '$': '$',
    '%': '%',
    '^': '^',
    '&': '&',
    '*': '*',
    '(': '(',
    ')': ')',
    'Quote': 'Quote',
    'Comma': 'Comma',
    'Period': 'Period',
    'Slash': 'Slash',
    'Semicolon': 'Semicolon',
    'Backquote': 'Backquote',
    'Backslash': 'Backslash'
};

export type KeyName = keyof typeof keyNames



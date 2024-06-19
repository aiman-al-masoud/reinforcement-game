# Theory:

[Theory](../../reinforcement-learning/notes.md)

# Quantization

The actual game has a continuous state. This state can be used to do physics. This "infinite" set of states can be quantized to a finite set of states.

This ensures that states that differ only slightly are not treated as completely different states.

The positions are quantized in such a way as to make them tile-based, like a grid.

# Game

There is a set of basic ingredients which work for a variety of actual games. The goals of the actual game can be chosen flexibly, for instance: collecting the most points, killing the opponent, etc ...

A single-screen platformer. There is a player, an npc and a map made of tiles. The npc has identical capabilities to the player. There are plaforms on which the player/npc can jump. There are collectible tokens (points) that increase the score. Hitting the npc/player decreases their health.


# TODO

- GUI
- record an episode from actual user gameplay

# BUGS

# BUG 1

With certain initial velocities x may end up exactly superimposed over y (without ever touching it as it should). So at the moment of collision you end up with vector (0,0) as your collision normal, which means separation velocity = zero.

# BUG 2

Sometimes order of application of rules matters.


# Pages

- main menu
- world manager
    - list of worlds
- world builder
- play
    - canvas
    - record/stop button
    - choose world
- train
    - choose parameters
- replay
    - choose episode
    - play/stop


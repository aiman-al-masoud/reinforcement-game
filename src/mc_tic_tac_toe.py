from typing import Dict, List, Literal, Tuple
import random
from dataclasses import dataclass

Mark = Literal['x', 'o', ' ']


@dataclass(frozen=True)
class State:

    rows: Tuple[Tuple[str, ...], ...] = (
        (' ', ' ', ' '),
        (' ', ' ', ' '),
        (' ', ' ', ' '),
    )

    def put_mark(self, r: int, c: int, mark: Mark):

        row_new = (*self.rows[r][:c], mark, *self.rows[r][c+1:])
        state_new = (*self.rows[:r], row_new, *self.rows[r+1:])
        return State(state_new)

    def possible_actions(self) -> 'List[Action]':

        actions: List[Action] = []

        for r, row in enumerate(self.rows):
            for c, mark in enumerate(row):
                if mark == ' ':
                    actions.append(Play(r, c))

        return actions

    def cols(self):

        return (
            (self.rows[0][0], self.rows[1][0], self.rows[2][0]),
            (self.rows[0][1], self.rows[1][1], self.rows[2][1]),
            (self.rows[0][2], self.rows[1][2], self.rows[2][2]),
        )

    def diags(self):

        return (
            (self.rows[0][0], self.rows[1][1], self.rows[2][2]),
            (self.rows[2][0], self.rows[1][1], self.rows[0][2]),
        )

    def is_win(self, mark: Mark):

        return (mark, mark, mark) in self.rows or \
               (mark, mark, mark) in self.cols() or \
               (mark, mark, mark) in self.diags()

    def flat(self):

        return [e for r in self.rows for e in r]

    def how_many(self, mark:Mark):

        return sum(m==mark for m in self.flat())

    def has_space(self):

        return ' ' in self.flat()

    def is_terminal(self):

        return self.is_win('x') or self.is_win('o') or not self.has_space()

    def reward(self, mark: Mark) -> float:

        if self.is_win(mark):
            return 1
        elif self.is_win('o' if mark == 'x' else 'x'):
            return -1
        else:
            return 0

    def turn(self) -> Mark:

        if self.how_many('x') > self.how_many('o'): # if x has already played
            return 'o'
        else: # else x has precedence
            return 'x'

    def is_valid(self):

        xs = self.how_many('x')
        os = self.how_many('o')

        return abs(xs - os) <= 1

    def __repr__(self) -> str:

        output = ''

        for r in self.rows:
            for e in r:
                output += '[ ' + e + ' ]'
            output += '\n'

        return output.strip()


@dataclass(frozen=True)
class Action:

    def perform(self, state: State, mark: Mark) -> State:
        raise NotImplemented


@dataclass(frozen=True)
class Play(Action):
    row: int
    col: int

    def perform(self, state: State, mark: Mark) -> State:
        return state.put_mark(self.row, self.col, mark)


@dataclass(frozen=True)
class NoOp(Action):

    def perform(self, state: State, mark: Mark) -> State:
        return state


class Policy:

    def __init__(self) -> None:

        self.state2action: Dict[State, Action] = {}

    def get_action(self, state: State) -> Action:

        if state in self.state2action:
            return self.state2action[state]
        else:
            return random.choice(state.possible_actions())

    def set_action(self,  state: State, action: Action):

        self.state2action[state] = action

    def play_against(self, pi2: 'Policy', s0: State, a0: Action) -> List[Tuple[State, Action]]:

        episode: List[Tuple[State, Action]] = []
        s, a = s0, a0

        if s0.turn() == 'x':

            while True:
                
                episode.append((s, a))

                s = a.perform(s, 'x')
                if s.is_terminal():
                    episode.append((s, NoOp()))
                    break

                s = pi2.get_action(s).perform(s, 'o')
                if s.is_terminal():
                    episode.append((s, NoOp()))
                    break

                a = self.get_action(s)
        else:

            while True:

                s = pi2.get_action(s).perform(s, 'o')
                if s.is_terminal():
                    episode.append((s, NoOp()))
                    break

                episode.append((s, a))
                s = a.perform(s, 'x')
                if s.is_terminal():
                    episode.append((s, NoOp()))
                    break

                a = self.get_action(s)

        return episode


class Value:

    def __init__(self) -> None:

        self.state2action2returns: Dict[State, Dict[Action, List[float]]] = {}

    def append_return(self, state: State, action: Action, g: float):

        if state not in self.state2action2returns:
            self.state2action2returns[state] = {}

        if action not in self.state2action2returns[state]:
            self.state2action2returns[state][action] = []

        self.state2action2returns[state][action].append(g)

    def best_action(self, state: State) -> Action:

        action_returns_pairs = self.state2action2returns[state].items()
        action_value_pairs = map(lambda e: (e[0], sum(e[1])/max(len(e[1]), 1)), action_returns_pairs)
        a, _ = max(action_value_pairs, key=lambda p: p[1])
        return a


def random_state(non_terminal=True) -> State:

    rows = tuple(tuple(random.choices(['x', 'o', ' '], k=3)) for _ in range(3))
    state = State(rows)

    if not state.is_valid():
        return random_state(non_terminal=non_terminal)
    elif non_terminal and state.is_terminal():
        return random_state(non_terminal=non_terminal)
    else:
        return state


def monte_carlo(max_iters=30_000, pi_opponent:Policy=Policy()):

    pi = Policy()
    q = Value()

    gamma = 0.3
    iters = 0

    while iters < max_iters:

        s0 = random_state(non_terminal=True)
        a0 = random.choice(s0.possible_actions())
        episode = pi.play_against(pi_opponent, s0, a0)
        g = 0

        for t in range(len(episode)-1, 0, -1):

            g = gamma * g + episode[t][0].reward('x')
            s, a = episode[t-1]

            q.append_return(s, a, g)
            pi.set_action(s, q.best_action(s))

        iters += 1

    return pi


def win_rate_against(pi1: Policy, pi2: Policy, max_iters=1000):

    wins = 0
    s0 = State()
    # s0 = random_state()

    for _ in range(max_iters):

        episode = pi1.play_against(pi2, s0, pi1.get_action(s0))

        if episode[-1][0].is_win('x'):
            wins += 1

    return 100 * wins/max_iters


if __name__ == '__main__':

    random.seed(100)


    # pi_rand = Policy()
    # pi_30k = monte_carlo(max_iters=30_000)
    # pi_60k = monte_carlo(max_iters=60_000)

    # rate_baseline = win_rate_against(pi_rand, pi_rand)
    # rate_30k = win_rate_against(pi_30k, pi_rand)
    # rate_60k = win_rate_against(pi_60k, pi_rand)
    # # print('states covered by 30k', len(pi_30k.state2action))
    # # print('states covered by 60k', len(pi_60k.state2action))
    # print(
    #     'baseline=', rate_baseline,
    #     'rate_30k=', rate_30k,
    #     'rate_60k=', rate_60k,
    # )

    # assert rate_30k > rate_baseline
    # assert rate_60k > rate_30k

    # -----------------------------------------------------

    # create a random policy
    pi_rand = Policy()
    # train the first policy against the random one
    pi1 = monte_carlo(max_iters=30_000, pi_opponent=pi_rand)
    # train the second policy against the first policy
    pi2 = monte_carlo(max_iters=30_000, pi_opponent=pi1)

    rate_random_vs_random = win_rate_against(pi_rand, pi_rand)
    rate_pi2_vs_random = win_rate_against(pi2, pi_rand)
    rate_pi2_vs_pi2 = win_rate_against(pi2, pi2)
    rate_pi2_vs_pi1 = win_rate_against(pi2, pi1)
    rate_pi1_vs_random = win_rate_against(pi1, pi_rand)

    assert rate_pi2_vs_random > rate_random_vs_random

    print(
        'rate_random_vs_random=', rate_random_vs_random, 
        'rate_pi1_vs_random=', rate_pi1_vs_random,
        'rate_pi2_vs_random=', rate_pi2_vs_random,
        'rate_pi2_vs_pi2=', rate_pi2_vs_pi2,
        'rate_pi2_vs_pi1=', rate_pi2_vs_pi1,
    )


    
    s0 = random_state()
    episode = pi2.play_against(pi_rand, s0, pi2.get_action(s0))
    for s, _ in episode:
        print(s)
        print('--------------------------')

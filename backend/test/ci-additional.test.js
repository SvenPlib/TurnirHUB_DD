const test = require('node:test');
const assert = require('node:assert/strict');

const { roundRobin } = require('../src/lib/schedule');
const { computeStandings } = require('../src/lib/standings');

const rules = {
  pointsWin: 3,
  pointsDraw: 1,
  pointsLoss: 0,
};

// TEST 1
test('generiranje razporeda ne spremeni izvirnega seznama ekip', () => {
  const teams = ['Ekipa A', 'Ekipa B', 'Ekipa C', 'Ekipa D'];
  const original = [...teams];

  roundRobin(teams);

  assert.deepEqual(teams, original);
});

// TEST 2
test('pri lihem številu ekip ima vsaka ekipa eno prosto kolo', () => {
  const teams = ['A', 'B', 'C', 'D', 'E'];
  const matches = roundRobin(teams);

  for (const team of teams) {
    const played = matches.filter(
      (m) => m.home === team || m.away === team
    );

    assert.equal(played.length, 4);

    const playedRounds = new Set(played.map((m) => m.round));
    assert.equal(playedRounds.size, 4);
  }

  const allRounds = new Set(matches.map((m) => m.round));
  assert.equal(allRounds.size, 5);
});

// TEST 3
test('tekma brez popolnega rezultata se ne upošteva v lestvici', () => {
  const teams = [
    { id: 1, name: 'Ekipa A' },
    { id: 2, name: 'Ekipa B' },
  ];

  const matches = [{
    homeTeamId: 1,
    awayTeamId: 2,
    homeScore: 2,
    awayScore: null,
    status: 'CONFIRMED',
  }];

  const standings = computeStandings(teams, matches, rules);

  assert.equal(standings[0].played, 0);
  assert.equal(standings[1].played, 0);
  assert.equal(standings[0].points, 0);
  assert.equal(standings[1].points, 0);
});

// TEST 4
test('pri neodločenem rezultatu obe ekipi dobita eno točko', () => {
  const teams = [
    { id: 1, name: 'Ekipa A' },
    { id: 2, name: 'Ekipa B' },
  ];

  const matches = [{
    homeTeamId: 1,
    awayTeamId: 2,
    homeScore: 2,
    awayScore: 2,
    status: 'CONFIRMED',
  }];

  const standings = computeStandings(teams, matches, rules);

  for (const team of standings) {
    assert.equal(team.played, 1);
    assert.equal(team.drawn, 1);
    assert.equal(team.points, 1);
    assert.equal(team.goalDiff, 0);
  }
});

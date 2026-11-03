import test from 'node:test';
import assert from 'node:assert/strict';
import { conferenceVisibleUntil, isConferenceVisible } from '../lib/conference.mjs';

test('conference expires at midnight in San Salvador after the two-week grace period', () => {
  const cutoff = Date.parse(conferenceVisibleUntil);
  assert.equal(cutoff, Date.parse('2027-02-14T00:00:00-06:00'));
  assert.equal(isConferenceVisible(cutoff - 1), true);
  assert.equal(isConferenceVisible(cutoff), false);
  assert.equal(isConferenceVisible(cutoff + 1), false);
});

test('conference remains visible through February 13 in the conference timezone', () => {
  assert.equal(isConferenceVisible(Date.parse('2027-02-14T00:00:00Z')), true);
  assert.equal(isConferenceVisible(Date.parse('2027-02-13T23:59:59-06:00')), true);
  assert.equal(isConferenceVisible(Date.parse('2027-02-14T00:00:00-06:00')), false);
});

test('visibility uses the current server clock by default', (t) => {
  const now = t.mock.method(Date, 'now', () => Date.parse('2027-02-13T23:59:59-06:00'));
  assert.equal(isConferenceVisible(), true);
  now.mock.mockImplementation(() => Date.parse('2027-02-14T00:00:00-06:00'));
  assert.equal(isConferenceVisible(), false);
});

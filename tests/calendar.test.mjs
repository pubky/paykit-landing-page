import test from 'node:test';
import assert from 'node:assert/strict';
import { conferenceCalendar } from '../lib/calendar.mjs';

test('calendar saves the conference as two all-day dates with valid escaped and folded CRLF lines', () => {
  const calendar = conferenceCalendar();
  const unfolded = calendar.replace(/\r\n /g, '');
  assert.match(unfolded, /DTSTART;VALUE=DATE:20270129\r\n/);
  assert.match(unfolded, /DTEND;VALUE=DATE:20270131\r\n/);
  assert.match(unfolded, /UID:paykit-planb-el-salvador-2027@paykit.pubky.org\r\n/);
  assert.match(unfolded, /SUMMARY:Paykit at Plan ₿ Forum El Salvador\r\n/);
  assert.ok(unfolded.includes('LOCATION:San Salvador\\, El Salvador\r\n'));
  assert.ok(unfolded.includes('\\nPaykit talks and where to find us will be announced.\\n'));
  assert.match(unfolded, /URL:https:\/\/planb.sv\/\r\n/);
  assert.doesNotMatch(unfolded, /Lugano|UTXO|Ben Kaufman|Denys Zaliskyi|VALARM|TRIGGER|DTSTART:/);
  assert.equal(calendar.includes('\uFFFD'), false);
  assert.equal(calendar.replace(/\r\n/g, '').includes('\n'), false);
  for (const line of calendar.split('\r\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= 75);
});

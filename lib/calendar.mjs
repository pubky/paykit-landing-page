export const conference = {
  title: 'Paykit at Plan ₿ Forum El Salvador',
  start: '20270129',
  end: '20270131',
  location: 'San Salvador, El Salvador',
  url: 'https://planb.sv/',
};

function escape(value) {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

// Fold by UTF-8 octets (RFC 5545), preserving multibyte characters.
function fold(line) {
  const parts = [];
  let chunk = '';
  let bytes = 0;
  for (const character of line) {
    const length = Buffer.byteLength(character, 'utf8');
    if (bytes + length > 75) {
      parts.push(chunk);
      chunk = ' ';
      bytes = 1;
    }
    chunk += character;
    bytes += length;
  }
  parts.push(chunk);
  return parts.join('\r\n');
}

export function conferenceCalendar() {
  const description = `Meet the Paykit/Pubky team (Synonym) at Plan ₿ Forum El Salvador, January 29–30, 2027.\nPaykit talks and where to find us will be announced.\nConference details: ${conference.url}`;
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Paykit//Plan B Forum El Salvador//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
    'UID:paykit-planb-el-salvador-2027@paykit.pubky.org',
    'DTSTAMP:20261026T000000Z',
    `DTSTART;VALUE=DATE:${conference.start}`, `DTEND;VALUE=DATE:${conference.end}`,
    `SUMMARY:${escape(conference.title)}`, `LOCATION:${escape(conference.location)}`,
    `DESCRIPTION:${escape(description)}`, `URL:${conference.url}`,
    'END:VEVENT', 'END:VCALENDAR', '',
  ].map(fold).join('\r\n');
}

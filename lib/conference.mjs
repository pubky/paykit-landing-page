// Midnight after February 13 in San Salvador (UTC−6), fourteen days after
// the January 29–30 conference ends.
export const conferenceVisibleUntil = '2027-02-14T06:00:00Z';

const conferenceCutoff = Date.parse(conferenceVisibleUntil);

export function isConferenceVisible(now = Date.now()) {
  return now < conferenceCutoff;
}

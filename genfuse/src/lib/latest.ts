/** Only the newest request may update the screen: an answer that arrives after a newer one is dropped. */
export function makeLatest() {
  let issued = 0;
  let applied = 0;
  return {
    start: () => ++issued,
    accept: (n: number) => {
      if (n < applied) return false;
      applied = n;
      return true;
    },
  };
}

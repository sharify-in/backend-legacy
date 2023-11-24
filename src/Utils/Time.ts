function TimeExpired(time: Date) {
  return time && Date.now() >= new Date(time).getTime();
}

export { TimeExpired };

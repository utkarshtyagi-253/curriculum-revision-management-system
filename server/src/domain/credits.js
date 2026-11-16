const MAX_COURSE_CREDITS = 12;
const CREDIT_INCREMENT = 0.5;

function parseCourseCredits(value) {
  if (typeof value === 'string' && !value.trim()) return null;
  const credits = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(credits) || credits <= 0 || credits > MAX_COURSE_CREDITS || !Number.isInteger(credits / CREDIT_INCREMENT)) {
    return null;
  }
  return credits;
}

module.exports = { MAX_COURSE_CREDITS, CREDIT_INCREMENT, parseCourseCredits };

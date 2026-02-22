const isVulnerable = () => process.env.APP_MODE === 'vulnerable';
const isSecure     = () => process.env.APP_MODE === 'secure';
module.exports = { isVulnerable, isSecure };
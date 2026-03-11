// Webpack loader that returns an empty module.
// Used to stub out TypeScript declaration files (.d.ts) which have no runtime
// content and should never be bundled as JavaScript modules.
module.exports = function () { return 'module.exports = {};'; };
module.exports.pitch = function () { return 'module.exports = {};'; };

// Use TypeScript's transpile-on-demand with specific config
require('ts-node').register({
  project: require('path').resolve(__dirname, '../../tsconfig.node.json'),
  transpileOnly: true,
});
const { typeDefs } = require('./schema.ts');
module.exports = typeDefs;

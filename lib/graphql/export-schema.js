// Use TypeScript's transpile-on-demand
require('ts-node/register');
const { typeDefs } = require('./schema.ts');
module.exports = typeDefs;

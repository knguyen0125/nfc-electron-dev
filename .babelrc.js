/* eslint-disable */
const plugins = [
  [require("@babel/plugin-proposal-decorators"), { "legacy": true }],
  [require("@babel/plugin-proposal-class-properties"), { loose: true }],
  [require("@babel/plugin-transform-runtime")],
];

module.exports = {
  plugins,
};

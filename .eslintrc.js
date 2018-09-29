module.exports = {
	/* your base configuration of choice */
	root: true,
  extends: 'airbnb-base',
  parser: 'babel-eslint',
  parserOptions: {
	  sourceType: 'module'
	},
  env: {
	  browser: true,
	  node: true
	},
  globals: {
	  __static: true
	},
	plugins: [
		'html'
	],
	rules: {
    'global-require': 0,
    'import/no-unresolved': 0,
    'no-param-reassign': 0,
    'no-shadow': 0,
    'import/extensions': 0,
    'import/newline-after-import': 0,
    'no-multi-assign': 0,
		'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    'strict': 0,
		'lines-between-class-members': 0,
    'linebreak-style': 0,
    'class-methods-use-this': 0,
    'prefer-arrow-callback': 0
	},
	settings: {
		'import/core-modules': [ 
			'electron',
      'vue-class-component',
      'vue-property-decorator',
      'webpack-merge'
		]
	}
}

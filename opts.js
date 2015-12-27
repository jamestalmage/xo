'use strict';
var path = require('path');
var arrify = require('arrify');
var pkgConf = require('pkg-conf');
var deepAssign = require('deep-assign');
var resolveFrom = require('resolve-from');
var objectAssign = require('object-assign');
var homeOrTmp = require('home-or-tmp');

var DEFAULT_IGNORE = [
	'node_modules/**',
	'bower_components/**',
	'coverage/**',
	'{tmp,temp}/**',
	'**/*.min.js',
	'**/bundle.js',
	'fixture{-*,}.{js,jsx}',
	'{test/,}fixture{s,}/**',
	'vendor/**',
	'dist/**'
];

var DEFAULT_CONFIG = {
	useEslintrc: false,
	cache: true,
	cacheLocation: path.join(homeOrTmp, '.xo-cache/'),
	baseConfig: {
		extends: 'xo'
	}
};

var DEFAULT_PLUGINS = [
	'no-empty-blocks'
	// https://github.com/dustinspecker/eslint-plugin-no-use-extend-native/issues/16
	// 'no-use-extend-native'
];

function normalizeOpts(opts) {
	// alias to help humans
	['env', 'global', 'ignore', 'plugin', 'rule', 'extend'].forEach(function (singular) {
		var plural = singular + 's';
		var value = opts[plural] || opts[singular];

		delete opts[singular];

		if (value === undefined) {
			return;
		}

		if (singular !== 'rule') {
			value = arrify(value);
		}

		opts[plural] = value;
	});

	return opts;
}

function mergeWithPkgConf(opts) {
	opts = objectAssign({
		cwd: process.cwd()
	}, opts);

	return objectAssign({}, pkgConf.sync('xo', opts.cwd), opts);
}

function buildConfig(opts) {
	var config = deepAssign({}, DEFAULT_CONFIG, {
		envs: opts.envs,
		globals: opts.globals,
		plugins: DEFAULT_PLUGINS.concat(opts.plugins || []),
		rules: opts.rules,
		fix: opts.fix
	});

	if (!config.rules) {
		config.rules = {};
	}

	if (opts.space) {
		var spaces = typeof opts.space === 'number' ? opts.space : 2;
		config.rules.indent = [2, spaces, {SwitchCase: 1}];
	}

	if (opts.semicolon === false) {
		config.rules.semi = [2, 'never'];
		config.rules['semi-spacing'] = [2, {before: false, after: true}];
	}

	if (opts.esnext) {
		config.baseConfig.extends = 'xo/esnext';
	} else {
		// always use the Babel parser so it won't throw
		// on esnext features in normal mode
		config.parser = 'babel-eslint';
		config.plugins = ['babel'];
		config.rules['generator-star-spacing'] = 0;
		config.rules['arrow-parens'] = 0;
		config.rules['object-curly-spacing'] = 0;
		config.rules['babel/object-curly-spacing'] = [2, 'never'];
	}

	if (opts.extends && opts.extends.length > 0) {
		// user's configs must be resolved to their absolute paths
		var configs = opts.extends.map(function (name) {
			if (name.indexOf('eslint-config-') === -1) {
				name = 'eslint-config-' + name;
			}

			return resolveFrom(opts.cwd, name);
		});

		configs.unshift(config.baseConfig.extends);

		config.baseConfig.extends = configs;
	}

	return config;
}

exports.DEFAULT_IGNORE = DEFAULT_IGNORE;
exports.DEFAULT_CONFIG = DEFAULT_CONFIG;
exports.mergeWithPkgConf = mergeWithPkgConf;
exports.normalizeOpts = normalizeOpts;
exports.buildConfig = buildConfig;

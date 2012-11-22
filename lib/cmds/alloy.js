/*
Copyright (c) 2012, Liferay Inc. All rights reserved.
Code licensed under the BSD License:
https://github.com/liferay/alloy-ui/blob/master/LICENSE.txt
*/

var argv = require('optimist').argv,
    config = require('../config'),
    git = require('../git'),
    log = require('../log'),
    path = require('path'),
    spawn = require('child_process').spawn,
    util = require('../util'),

    Alloy = {
        RESERVED: {
            '$0': 1,
            '_': 1
        },

        DEFAULT_COMPASS_OPTIONS: {
            'css-dir': '.',
            'images-dir': 'img',
            'output-style': 'expanded',
            'force': undefined,
            'no-line-comments': undefined,
            'time': undefined,
            'trace': undefined
        },

        isReserved: function(word) {
            var instance = this;

            return instance.RESERVED.hasOwnProperty(word);
        },

        toCamelCase: function(str) {
            return str.replace(/(\-[a-z])/g, function(m) {
                return m.toUpperCase().replace('-', '');
            });
        },

        compass: function(command, files, options) {
            var instance = this,
                cwd = git.findRoot() + '/../',
                configs = {},
                args = [command];

            util.mix(configs, instance.DEFAULT_COMPASS_OPTIONS);
            util.mix(configs, options || {});

            Object.keys(configs).forEach(function(config) {
                var value = configs[config];

                args.push('--' + config);

                if (value !== undefined) {
                    args.push(value);
                }
            });

            args = args.concat(files);

            child = spawn('compass', args, { cwd: cwd });

            child.stdout.on('data', function (data) {
                log.info(util.good + ' ' + command + ' ' + files.join(', '));
                log.log(data.toString());
            });
        }
    },

    mods = {
        init: function() {
            var instance = this;

            Object.keys(argv).forEach(function(command) {
                if (!Alloy.isReserved(command)) {
                    var method = Alloy.toCamelCase(command),
                        payload = argv[command];

                    if (mods[method]) {
                        log.info(util.good + ' Invoking ' + command);

                        mods[method].call(instance, payload, argv);
                    }
                    else {
                        log.bail(util.bad + ' Ops, ' + command + ' is not recognized as a valid command');
                    }
                }
            });
        },

        help: function() {
            return [
                'alloy',
                'alloy ui library utilities',
                '--compile-css compile alloy bootstrap css',
                '--watch-css watch alloy bootstrap css'
            ];
        },

        compileCss: function(payload, parsed) {
            var instance = this;

            if (instance._isValidCSSFolder()) {
                Alloy.compass('compile', [ 'lib/bootstrap.scss', 'lib/responsive.scss' ]);
                Alloy.compass('compile', [ 'lib/bootstrap.min.scss', 'lib/responsive.min.scss' ], { 'output-style': 'compressed' });
            }

        },

        watchCss: function(payload, parsed) {
            var instance = this;

            if (instance._isValidCSSFolder()) {
                Alloy.compass('watch', [ 'lib/bootstrap.scss', 'lib/responsive.scss' ]);
                Alloy.compass('watch', [ 'lib/bootstrap.min.scss', 'lib/responsive.min.scss' ], { 'output-style': 'compressed' });
            }
        },

        _isValidCSSFolder: function() {
            var instance = this,
                root = git.findRoot(),
                origin;

            if (root) {
                origin = git.origin();

                if (origin.indexOf('alloy-bootstrap') > -1) {
                    return true;
                }
            }

            log.bail(util.bad + ' You must be inside alloy-bootstrap repo for this to work!');

            return false;
        }
    };

util.mix(exports, mods);
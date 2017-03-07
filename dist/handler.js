'use strict';

var R = require('ramda');

var _require = require('./utils'),
    buttonLens = _require.buttonLens,
    buttonArrayToXml = _require.buttonArrayToXml;

var debug = require('debug')('botmaster:button:handler');

/**
 *  A botmaster update handler that passes through to main handler if there is no match at all or the match is not an action. If there are multiple possible matches to the button then it asks for confirmation.
 *  @param {Object} options the options for generated middleware
 *  @param {Function} options.mainHandler the main handler to pass through to if there is no button matched
 *  @param {String} options.sessionPath dot denoted patch to session object where the 'button' property that stores button context is located. Defaults to 'session'.
 *  @param {String} options.confirmText the text to use to confirm when there multiple matches
 *  @returns {Function} a botmaster update handler
 */
var ButtonHandler = function ButtonHandler(options) {
    var _options$sessionPath = options.sessionPath,
        sessionPath = _options$sessionPath === undefined ? 'session' : _options$sessionPath,
        _options$confirmText = options.confirmText,
        confirmText = _options$confirmText === undefined ? 'I am sorry I got multiple matches, can you please confirm.' : _options$confirmText;

    return function (bot, update, next) {
        var thisButtonLens = R.compose(R.lensPath(sessionPath.split('.')), buttonLens);
        var buttonResult = R.view(thisButtonLens, update);
        if (buttonResult.multiple) {
            debug('asking for confirmation');
            bot.reply(update, '' + confirmText + buttonArrayToXml(buttonResult.matches)).catch(function (err) {
                return next(err);
            });
        } else if (buttonResult) {
            if (buttonResult.isAction) {
                debug('button contains action - straight to middleware');
                bot.reply(update, buttonResult.payload).catch(function (err) {
                    return next(err);
                });
            } else {
                debug('button found - sending payload to main handler');
                update.message.text = buttonResult.payload;
                next();
            }
        } else {
            debug('no button - calling handler');
            next();
        }
    };
};

module.exports = { ButtonHandler: ButtonHandler };
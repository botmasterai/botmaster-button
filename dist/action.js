'use strict';

var R = require('ramda');

var _require = require('botmaster-fulfill'),
    isPendingActions = _require.isPendingActions,
    FulfillOutgoingWare = _require.FulfillOutgoingWare;

var _require2 = require('./utils'),
    updateWithButtonPayload = _require2.updateWithButtonPayload,
    buttonArrayToXml = _require2.buttonArrayToXml;

/**
 * Action spec for buttons
 * ```html
 * <buttons>Option 1, Option 2</buttons>
 * ```
 * @constant
 * @param {null}
 */


var buttons = {
    controller: function controller(_ref) {
        var content = _ref.content;

        var array = content.split(',').map(function (payload) {
            return { payload: payload.trim(' ') };
        });
        return buttonArrayToXml(array);
    }
};

/**
 * Button fulfill action factory function
 * @param {OBject} options
 * @param  {String} options.sessionPath dot denoated path to prop where context is stored
 * @param {Object} options.actions actions that can be processed
 * @return {Object} action spec for <button />
 */
var ButtonAction = function ButtonAction(options) {
    return {
        series: true,
        controller: function controller(_ref2, next) {
            var bot = _ref2.bot,
                update = _ref2.update,
                attributes = _ref2.attributes,
                content = _ref2.content,
                index = _ref2.index,
                before = _ref2.before;

            // the title is what is shown in the button
            var title = void 0;
            if (bot.implements.quickReply) {
                title = attributes.title || content;
            } else {
                title = attributes.title || index + 1 + '. ' + content;
            }

            // store the button payload in the session
            if (options.sessionPath) {
                var storePayload = {
                    title: title,
                    payload: content
                };
                if (options.actions) {
                    storePayload.isAction = isPendingActions(content, options.actions);
                }
                updateWithButtonPayload(update, options.sessionPath, storePayload);
            }

            // remove the tag from the remaining text
            next(null, '').then(function () {
                var promise = void 0;
                // use either the messenger format or a text format
                if (bot.implements.quickReply) {
                    promise = bot.sendDefaultButtonMessageTo({
                        title: title,
                        payload: content,
                        image: attributes.image
                    }, update.sender.id);
                } else {
                    promise = bot.reply(update, title);
                }

                promise.catch(function (err) {
                    if (err.message && err.message.indexOf('No response after fulfill or response is not a string') == -1 && err.message.indexOf('Response is empty after trimming') > -1) {
                        console.log('non fatal error in button action');
                        console.log(err);
                    }
                });
            });
        }
    };
};

/**
 * Botmaster Button outgoing ware factory function
 * @param {Object} [options]
 * @param  {String} [options.sessionPath] dot denoted path to prop where context is stored
 * @param {Object} [options.actions] actions that can be processed
 * @return {Function} botmaster middleware for button
 */
var ButtonOutgoingWare = function ButtonOutgoingWare(options) {
    return FulfillOutgoingWare({
        actions: R.merge(options.actions, {
            button: ButtonAction(options),
            buttons: buttons
        })
    });
};

module.exports = {
    ButtonAction: ButtonAction,
    ButtonOutgoingWare: ButtonOutgoingWare,
    buttons: buttons
};
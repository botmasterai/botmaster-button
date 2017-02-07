const R = require('ramda');
const {buttonLens, buttonArrayToXml} = require('./utils');
const debug = require('debug')('botmaster:button:handler');

const updateToMessage = (update, message = {}) => {
    const merged = R.merge(update, message);
    merged.recipient = update.sender;
    merged.sender = update.recipient;
    return merged;
};

/**
 *  A botmaster update handler that passes through to main handler if there is no match at all or the match is not an action. If there are multiple possible matches to the button then it asks for confirmation.
 *  @param {Object} options the options for generated middleware
 *  @param {Function} options.mainHandler the main handler to pass through to if there is no button matched
 *  @param {String} options.sessionPath dot denoted patch to session object where the 'button' property that stores button context is located. Defaults to 'session'.
 *  @param {String} options.confirmText the text to use to confirm when there multiple matches
 *  @returns {Function} a botmaster update handler
 */
const ButtonHandler = (options) => {
    const {sessionPath = 'session', confirmText = 'I am sorry I got multiple matches, can you please confirm.'} = options;
    return (bot, update, next) => {
        const thisButtonLens = R.compose(R.lensPath(sessionPath.split('.')), buttonLens);
        const buttonResult = R.view(thisButtonLens, update);
        if (buttonResult.multiple) {
            debug('asking for confirmation');
            bot.sendMessage(updateToMessage(update, {
                message: {
                    text: `${confirmText}${buttonArrayToXml(buttonResult.matches)}`
                }
            }));
        } else if (buttonResult) {
            update.message.text = buttonResult.payload;
            if (buttonResult.isAction) {
                debug('button contains action - straight to middleware');
                bot.sendMessage(updateToMessage(update));
            }
            else {
                debug('button found - sending payload to main handler');
                next();
            }
        } else {
            debug('no button - calling handler');
            next();
        }
    };
};

module.exports = { ButtonHandler };

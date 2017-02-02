const R = require('ramda');
const {buttonLens, buttonArrayToXml} = require('./utils');

/**
 *  A botmaster update handler that passes through to main handler if there is no match at all or the match is not an action
 *  If there are multiple possible matches to the button then it asks for confirmation.
 *  @param {Function} options.mainHandler the main handler to pass through to if there is no button matched
 *  @param {String} options.sessionPath dot denoted patch to session object where the button is stored
 *  @param {String} options.confirmText the text to use to confirm when there multuple matches
 *  @returns {Function} a botmaster update handler
 */
const ButtonHandler = ({mainHandler, sessionPath, confirmText}) => (bot, update) => {
    const thisButtonLens = R.compose(R.lensPath(sessionPath.split('.')), buttonLens);
    const buttonResult = R.view(thisButtonLens, update);
    if (buttonResult.multiple) {
        bot.reply(update, `${confirmText}${buttonArrayToXml(buttonResult.matches)}`);
    } else if (buttonResult) {
        if (buttonResult.isAction)
            bot.reply(update, buttonResult.payload);
        else {
            update.message.text = buttonResult.payload;
            mainHandler(bot, update);
        }
    }
};

module.exports = { ButtonHandler };

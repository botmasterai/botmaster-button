const R = require('ramda');
const {isPendingActions, FulfillOutgoingWare} = require('botmaster-fulfill');
const {updateWithButtonPayload, buttonArrayToXml } = require('./utils');

/**
 * Action spec for buttons
 * ```html
 * <buttons>Option 1, Option 2</buttons>
 * ```
 * @constant
 * @param {null}
 */
const buttons = {
    controller: ({content}) => {
        const array = content.split(',').map(payload => ({payload: payload.trim(' ')}));
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
const ButtonAction = options => ({
    series: true,
    controller: ({bot, update, attributes, content, index, before}, next) => {
        // the title is what is shown in the button
        let title;
        if (bot.implements.quickReply) {
            title = attributes.title || content;
        } else {
            title = attributes.title || `${index + 1}. ${content}`;
        }

        // store the button payload in the session
        if (options.sessionPath) {
            const storePayload = {
                title,
                payload: content
            };
            if (options.actions) {
                storePayload.isAction = isPendingActions(content, options.actions);
            }
            updateWithButtonPayload(update, options.sessionPath, storePayload);
        }


        // remove the tag from the remaining text
        next(null, '').then( () => {
            let promise;
            // use either the messenger format or a text format
            if (bot.implements.quickReply) {
                promise = bot.sendDefaultButtonMessageTo({
                    title,
                    payload: content,
                    image: attributes.image
                },
                    update.sender.id
                );
            } else {
                promise = bot.reply(update, title);
            }

            promise.catch( err => {
                if (err.message &&
                    err.message.indexOf('No response after fulfill or response is not a string') == -1 &&
                    err.message.indexOf('Response is empty after trimming') > -1
                ) {
                    console.log('non fatal error in button action');
                    console.log(err);
                }
            });
        });
    }
});

/**
 * Botmaster Button outgoing ware factory function
 * @param {Object} [options]
 * @param  {String} [options.sessionPath] dot denoted path to prop where context is stored
 * @param {Object} [options.actions] actions that can be processed
 * @return {Function} botmaster middleware for button
 */
const ButtonOutgoingWare = options => FulfillOutgoingWare({
    actions: R.merge(options.actions, {
        button: ButtonAction(options),
        buttons
    })
});

module.exports = {
    ButtonAction,
    ButtonOutgoingWare,
    buttons
};

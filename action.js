const R = require('ramda');
const {isPendingActions, FulfillOutgoingWare} = require('botmaster-fulfill');
const {updateWithButtonPayload, updateWithQuickReply } = require('./utils');

/**
 * Button fulfill action factory function
 * @param {OBject} options
 * @param  {String} options.sessionPath dot denoated path to prop where context is stored
 * @param {Object} options.actions actions that can be processed
 * @return {Object} action spec for <button />
 */
const ButtonAction = options => ({
    series: true,
    replace: 'before',
    controller: ({bot, update, attributes, content, index, before}) => {
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

        // use either the messenger format or a text format
        if (bot.implements.quickReply) {
            updateWithQuickReply(update, {
                title,
                payload: content,
                image: attributes.image
            });
        } else {
            if (index === 0) {
                const beforeUpdate = R.clone(update);
                beforeUpdate.message.text = before;
                bot.sendMessage(beforeUpdate);
            }
            const newUpdate = R.clone(update);
            newUpdate.message.text = title;
            bot.sendMessage(newUpdate);
        }

        // remove the tag from the remaining text
        return '';
    }
});

/**
 * Botmaster Button outgoing ware factory function
 * @param {Object} [options]
 * @param  {String} [options.sessionPath] dot denoated path to prop where context is stored
 * @param {Object} [options.actions] actions that can be processed
 * @return {Function} botmaster middleware for button
 */
const ButtonOutgoingWare = options => FulfillOutgoingWare({
    actions: R.merge(options.actions, {button: ButtonAction(options)})
});

module.exports = {
    ButtonAction,
    ButtonOutgoingWare
};

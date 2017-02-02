const R = require('ramda');
const {isPendingActions} = require('botmaster-fulfill');
const {updateWithStorePayload, updateWithQuickReply } = require('./utils');

/**
 * Button fulfill action factory function
 * @param  {String} options.sessionPath dot denoated path to prop where context is stored
 * @param {Object} options.actions actions that can be processed
 * @return {Object} action spec for <button />
 */
const ButtonAction = options => ({
    series: true,
    controller: ({bot, update, attributes, content, index}) => {

        // the title is what is shown in the button
        let title;
        if (bot.implements.button)
            title = attributes.title || content;
        else
            title = attributes.title || `${index}. ${content}`;

        // store the button payload in the session
        if (options.sessionPath) {
            const storePayload = {
                title,
                payload: content
            };
            if (options.actions) {
                storePayload.isAction = isPendingActions(content, options.actions);
            }
            updateWithStorePayload(update, options.sessionPath, storePayload);
        }

        // use either the messenger format or a text format
        if (bot.implements.button) {
            updateWithQuickReply(update, {
                title,
                payload: content,
                image: attributes.image
            });
        } else {
            const newUpdate = R.clone(update);
            newUpdate.message.text = title;
            bot.sendMessage(newUpdate);
        }

        // remove the tag from the remaining text
        return '';
    }
});

module.exports = {ButtonAction};

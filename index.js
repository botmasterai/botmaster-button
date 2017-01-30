const R = require('ramda');

/**
 * Utils for standard quick reply using messenger format
 */
const quickReplyLens = R.lensPath(['message', 'quick_replies']);
// takes an update object and updates it with a quick reply with options
const updateWithQuickReply = (update, {title, payload, image}) => {
    const quickReply = {
        'content_type': 'text',
        title,
        payload,
        'image_url': image
    };
    update.message = R.over(quickReplyLens, R.append(quickReply), update);
};

/**
 * Utils for text quick reply using session storage to convert title (should be '1' or '2' normally) to payload
 */
const buttonPayloadLens = (sessionProp, title) => R.lensPath([sessionProp, 'buttonPayloads', title]);
const updateWithStorePayload = (update, {sessionProp, payload}) => {
    // append the button payload to button payloads list
    update[sessionProp] = R.over(buttonPayloadLens, R.compose(R.append(payload), R.defaultTo([])), update);
};

/**
 * Button fulfill action factory function
 * @param  {String} options.storePayload the prop where context is stored
 * @return {Object} action spec for <button />
 */
const ButtonAction = options => ({
    controller: ({bot, update, attributes, content, index}) => {
        if (bot.implements.button) {
            updateWithQuickReply(update, {
                title: attributes.title || content,
                payload: content,
                image: attributes.image
            });
        } else {
            const newUpdate = R.clone(update);
            newUpdate.message.text = `${index}. ${content}`;
            bot.sendMessage(newUpdate);
            if (options.storePayload) {
                updateWithStorePayload(update, {
                    sessionProp: options.storePayload,
                    title: index,
                    payload: content
                });
            }
        }
        return '';
    }
});

// util to check for an input matching a title
const trimAndLower = string => R.compose(R.toLower, R.trim)(string);
const inputMatchesPayload = (input, buttonPayload) => R.compose(R.equals(trimAndLower(R.prop('title', buttonPayload))), trimAndLower)(input);
const fulfill = require('botmaster-fulfill');

/**
 * A botmaster-enrich session/context enricher
 * @param {Object} options.actions if you wish to pre-parse user input with actions provide the object of action specs here
 * @returns {Object} enricher spec
 */
const ButtonEnricher = options => ({
    controller: ({update, context, bot}, cb) => {
        let payload;
        const storedPayload = R.findLast(inputMatchesPayload(update.message.text, R.__), context);
        if (storedPayload)
            payload = storedPayload.payload;
        else
            payload = update.message.text;

        if (options.actions) {
            fulfill(options.actions, {bot, update}, update.message.text, (err, response) => {
                if (!err) bot.reply(update, response);
                cb(err);
            });
        } else {
            update.message.text = payload;
            process.nextTick(cb);
        }
    }
});

module.exports = {
    ButtonAction,
    ButtonEnricher
};

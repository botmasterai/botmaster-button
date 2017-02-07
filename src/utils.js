const R = require('ramda');
const render = require('posthtml-render');
const fuzzy = R.curry(require('fuzzysearch'));

// turn an object specifying a button into a an xml tree as per posthtml-render
const buttonObjectToTree = button => ({
    tag: 'button',
    content: button.payload,
    attrs: {
        image: button.image,
        title: button.title
    }
});
// turn a button array into an xml tree as per posthtml-render
const buttonArrayToTree = R.map(buttonObjectToTree);
// turn a button array into xml
const buttonArrayToXml = R.compose(render, buttonArrayToTree);

// where to store the button paylaods in session
const buttonPayloadLens = R.lensProp('buttonPayloads');
// add a button payload to the session
const updateWithButtonPayload = (update, sessionPath, payload) => {
    // append the button payload to button payloads list
    sessionPath = sessionPath.split('.');
    const thisButtonPayloadLens = R.compose(R.lensPath(sessionPath.splice(1)), buttonPayloadLens);
    update[sessionPath[0]] = R.over(thisButtonPayloadLens, R.compose(R.append(payload), R.defaultTo([])), update[sessionPath[0]]);
};

// lens for quick replies in update/message
const quickReplyLens = R.lensPath(['message', 'quick_replies']);
// takes an update object and updates it with a messenger format quick reply with options
const updateWithQuickReply = (update, {title, payload, image}) => {
    const quickReply = {
        'content_type': 'text',
        title,
        payload,
        'image_url': image
    };
    update.message = R.over(quickReplyLens, R.append(quickReply), update);
};

// utility to match array of buttons against a text string using fuzzy search
const matchingButtons = (text, buttons) => R.filter(R.propSatisfies(title => fuzzy(text.toLowerCase(), title.toLowerCase()), 'title'), buttons);
// where to store the basic button context in session
const buttonLens = R.lensProp('button');

module.exports = {
    buttonPayloadLens,
    buttonArrayToXml,
    buttonLens,
    updateWithButtonPayload,
    updateWithQuickReply,
    matchingButtons,
};

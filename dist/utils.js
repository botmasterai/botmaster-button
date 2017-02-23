'use strict';

var R = require('ramda');
var render = require('posthtml-render');
var fuzzy = R.curry(require('fuzzysearch'));

// turn an object specifying a button into a an xml tree as per posthtml-render
var buttonObjectToTree = function buttonObjectToTree(button) {
    return {
        tag: 'button',
        content: button.payload,
        attrs: {
            image: button.image,
            title: button.title
        }
    };
};
// turn a button array into an xml tree as per posthtml-render
var buttonArrayToTree = R.map(buttonObjectToTree);
// turn a button array into xml
var buttonArrayToXml = R.compose(render, buttonArrayToTree);

// where to store the button paylaods in session
var buttonPayloadLens = R.lensProp('buttonPayloads');
// add a button payload to the session
var updateWithButtonPayload = function updateWithButtonPayload(update, sessionPath, payload) {
    // append the button payload to button payloads list
    sessionPath = sessionPath.split('.');
    var thisButtonPayloadLens = R.compose(R.lensPath(sessionPath.splice(1)), buttonPayloadLens);
    update[sessionPath[0]] = R.over(thisButtonPayloadLens, R.compose(R.append(payload), R.defaultTo([])), update[sessionPath[0]]);
};

// lens for quick replies in update/message
//const quickReplyLens = R.lensProp('quick_replies');
// takes an update object and updates it with a messenger format quick reply with options
/*const updateWithQuickReply = (update, {title, payload, image}) => {

    const quickReply = {
        'content_type': 'text',
        title,
        payload,
        'image_url': image
    };
    update.message = R.over(quickReplyLens, R.compose(R.append(quickReply), R.defaultTo([])), update.message);
};*/

// utility to match array of buttons against a text string using fuzzy search
var matchingButtons = function matchingButtons(text, buttons) {
    return R.filter(R.propSatisfies(function (title) {
        return fuzzy(text.toLowerCase(), title.toLowerCase());
    }, 'title'), buttons);
};
// where to store the basic button context in session
var buttonLens = R.lensProp('button');

module.exports = {
    buttonPayloadLens: buttonPayloadLens,
    buttonArrayToXml: buttonArrayToXml,
    buttonLens: buttonLens,
    updateWithButtonPayload: updateWithButtonPayload,
    //updateWithQuickReply,
    matchingButtons: matchingButtons
};
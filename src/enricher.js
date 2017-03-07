const R = require('ramda');
const {buttonPayloadLens, buttonLens, matchingButtons} = require('./utils');
const {EnrichIncomingWare} = require('botmaster-enrich');
const debug = require('debug')('botmaster:button:enricher');

/**
 * A botmaster-enrich session/context enricher. If user inputs fuzzy matches the title of a button the matched button is placed in 'button' in session/context. Multiple matches are stored in 'button.matches' and 'button.multiple' is set to true
 * @returns {Object} enricher spec
 */
const ButtonEnricher = () => ({
    controller: ({update, context}) => {
        const buttons = R.view(buttonPayloadLens, context);
        let updatedContext = {};
        updatedContext = R.set(buttonLens, false, updatedContext);
        if (buttons && buttons.length > 0) {
            const matches = matchingButtons(update.message.text, buttons);
            if (matches.length == 1) {
                debug(`matching button ${matches[0].title}`);
                updatedContext = R.set(buttonLens, matches[0], updatedContext);
            } else if (matches.length > 1) {
                debug(`multiple button matches ${matches.map(R.prop('title')).join(', ')}`);
                updatedContext = R.set(buttonLens, {multiple: true, matches}, updatedContext);
            } else {
                debug('no button matched');
                updatedContext = R.set(buttonPayloadLens, [], updatedContext);
            }
        } else {
            debug('no buttons to match');
        }
        return updatedContext;
    }
});

/**
 * A botmaster incoming ware factory function that sets up button enricher
 * @param {Object} [options] options for the produced middleware
 * @param {String} [options.sessionPath] dot denoted path to session in update defaults to "session"
 * @param {Object} [options.enrichers] other enrichers to also evaluate
 * @returns {Function} botmaster incoming ware that evaluates buttons
 */
const ButtonIncomingWare = (options) => EnrichIncomingWare({
    enrichers: R.merge(options.enrichers || {}, {button: ButtonEnricher()}),
    sessionPath: options.sessionPath  || 'session'
});

module.exports = {
    ButtonEnricher,
    ButtonIncomingWare
};

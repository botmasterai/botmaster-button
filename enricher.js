const R = require('ramda');
const {buttonPayloadLens, buttonLens, matchingButtons} = require('./utils');
const {EnrichIncomingWare} = require('botmaster-enrich');

/**
 * A botmaster-enrich session/context enricher.
 * If user inputs fuzzy matches the title of a buttona the matched button is placed in 'button' in session/context
 * Multiple matches are stored in 'button.matches' and 'button.multiple' is set to true
 * @returns {Object} enricher spec
 */
const ButtonEnricher = () => ({
    controller: ({update, context}) => {
        const buttons = R.view(buttonPayloadLens, context);
        let updatedContext = {};
        if (buttons.length > 0) {
            const matches = matchingButtons(update.message.text, buttons);
            if (matches.length == 0) {
                updatedContext = R.set(buttonLens, matches[0], updatedContext);
            } else if (matches.length > 0) {
                updatedContext = R.set(buttonLens, {multiple: true, matches}, updatedContext);
            }
            updatedContext = R.set(buttonPayloadLens, [], updatedContext);
        } else {
            updatedContext = R.set(buttonLens, false, updatedContext);
        }
        return updatedContext;
    }
});

/**
 * A botmaster incoming ware factory function that sets up button enricher
 * @param {String} options.sessionPath dot denoted path to session in update
 * @returns {Function} botmaster incoming ware that evaluates buttons
 */
const ButtonIncomingWare = ({sessionPath}) => EnrichIncomingWare({
    enrichers: {button: ButtonEnricher()},
    sessionPath
});

module.exports = {
    ButtonEnricher,
    ButtonIncomingWare
};

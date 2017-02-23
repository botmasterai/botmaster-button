'use strict';

var R = require('ramda');

var _require = require('./utils'),
    buttonPayloadLens = _require.buttonPayloadLens,
    buttonLens = _require.buttonLens,
    matchingButtons = _require.matchingButtons;

var _require2 = require('botmaster-enrich'),
    EnrichIncomingWare = _require2.EnrichIncomingWare;

var debug = require('debug')('botmaster:button:enricher');

/**
 * A botmaster-enrich session/context enricher. If user inputs fuzzy matches the title of a button the matched button is placed in 'button' in session/context. Multiple matches are stored in 'button.matches' and 'button.multiple' is set to true
 * @returns {Object} enricher spec
 */
var ButtonEnricher = function ButtonEnricher() {
    return {
        controller: function controller(_ref) {
            var update = _ref.update,
                context = _ref.context;

            var buttons = R.view(buttonPayloadLens, context);
            var updatedContext = {};
            if (buttons && buttons.length > 0) {
                var matches = matchingButtons(update.message.text, buttons);
                if (matches.length == 1) {
                    debug('matching button ' + matches[0].title);
                    updatedContext = R.set(buttonLens, matches[0], updatedContext);
                } else if (matches.length > 1) {
                    debug('multiple button matches ' + matches.map(R.prop('title')).join(', '));
                    updatedContext = R.set(buttonLens, { multiple: true, matches: matches }, updatedContext);
                }
                debug('no button matched');
                updatedContext = R.set(buttonPayloadLens, [], updatedContext);
            } else {
                debug('no buttons to match');
                updatedContext = R.set(buttonLens, false, updatedContext);
            }
            return updatedContext;
        }
    };
};

/**
 * A botmaster incoming ware factory function that sets up button enricher
 * @param {Object} [options] options for the produced middleware
 * @param {String} [options.sessionPath] dot denoted path to session in update defaults to "session"
 * @param {Object} [options.enrichers] other enrichers to also evaluate
 * @returns {Function} botmaster incoming ware that evaluates buttons
 */
var ButtonIncomingWare = function ButtonIncomingWare(options) {
    return EnrichIncomingWare({
        enrichers: R.merge(options.enrichers || {}, { button: ButtonEnricher() }),
        sessionPath: options.sessionPath || 'session'
    });
};

module.exports = {
    ButtonEnricher: ButtonEnricher,
    ButtonIncomingWare: ButtonIncomingWare
};
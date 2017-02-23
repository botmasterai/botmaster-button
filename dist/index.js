'use strict';

var _require = require('./action'),
    ButtonAction = _require.ButtonAction,
    ButtonOutgoingWare = _require.ButtonOutgoingWare,
    buttons = _require.buttons;

var _require2 = require('./enricher'),
    ButtonEnricher = _require2.ButtonEnricher,
    ButtonIncomingWare = _require2.ButtonIncomingWare;

var _require3 = require('./handler'),
    ButtonHandler = _require3.ButtonHandler;

var utils = require('./utils');

/**
 * For the truly lazy aka yours truly, a function that sets up button middleware and handler
 * @param  {Object} botmaster an instantiated botmaster object
 * @param {Object} [options]
 * @param  {Object} [options.actions] actions that can be invoked through buttons
 * @param  {String} [options.sessionPath] dot denoted path of where to get session/context in updates
 * @param  {String} [options.confirmText] what to say when we get multiple matches for a button
 */
var bootstrap = function bootstrap(botmaster, options) {
    botmaster.use('incoming', ButtonIncomingWare(options));
    botmaster.use('incoming', ButtonHandler(options));
    botmaster.use('outgoing', ButtonOutgoingWare(options));
};

module.exports = {
    Incoming: ButtonIncomingWare,
    Outgoing: ButtonOutgoingWare,
    ButtonOutgoingWare: ButtonOutgoingWare,
    ButtonIncomingWare: ButtonIncomingWare,
    action: ButtonAction,
    enricher: ButtonEnricher,
    handler: ButtonHandler,
    ButtonAction: ButtonAction,
    ButtonEnricher: ButtonEnricher,
    ButtonHandler: ButtonHandler,
    bootstrap: bootstrap,
    buttons: buttons,
    utils: utils
};
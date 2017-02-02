const {ButtonAction, ButtonOutgoingWare} = require('./action');
const {ButtonEnricher, ButtonIncomingWare} = require('./enricher');
const {ButtonHandler} = require('./handler');
const utils = require('./utils');

/**
 * For the truly lazy aka yours truly, a function that sets up button middleware and handler
 * @param  {Object} botmaster an instantiated botmaster object
 * @param  {Function} options.mainHandler the main on update handler for botmaster
 * @param  {Object} options.actions actions that can be invoked through buttons
 * @param  {String} options.sessionPath dot denoted path of where to get session/context in updates
 * @param  {String} options.confirmText what to say when we get multiple matches for a button
 */
const bootstrap = (botmaster, options) => {
    botmaster.use('incoming', ButtonIncomingWare(options));
    botmaster.on('update', ButtonHandler(options));
    botmaster.use('outgoing', ButtonOutgoingWare(options));
};

module.exports = {
    Incoming: ButtonIncomingWare,
    Outgoing: ButtonOutgoingWare,
    ButtonOutgoingWare,
    ButtonIncomingWare,
    action: ButtonAction,
    enricher: ButtonEnricher,
    handler: ButtonHandler,
    ButtonAction,
    ButtonEnricher,
    ButtonHandler,
    bootstrap,
    utils
};

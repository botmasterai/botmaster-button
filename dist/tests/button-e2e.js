'use strict';

var R = require('ramda');

var _require = require('../'),
    bootstrap = _require.bootstrap;

var _require2 = require('botmaster-test'),
    botmaster = _require2.botmaster,
    telegramMock = _require2.telegramMock;

var SessionWare = require('botmaster-session-ware');
require('should');

describe('botmaster-button', function () {
    var myBotmaster = void 0;
    var myTelegramMock = void 0;
    var sessionWare = void 0;
    var actions = {
        itsComplicated: {
            controller: function controller() {
                return '\n                <button>It\'s complicated because we want it to be that way.</button>\n                <button>It\'s complicated because life is complicated.</button>\n                <button>Mind your own business.</button>\n            ';
            }
        }
    };
    var buttonWareOptions = {
        actions: actions,
        sessionPath: 'session',
        confirmText: 'I am sorry I got multiple matches, can you please confirm.'
    };
    var mainHandler = function mainHandler(bot, update) {
        var newUpdate = R.clone(update);
        newUpdate.message.text = '\n            Hello.\n            <button image=\'https://images/ring.png\'>I am in a relationship</button>\n            <button>I am not in a relationship</button>\n            <button title=\'3. Its Complicated\'><itsComplicated /></button>'.replace(/\s+/g, ' ');
        bot.sendMessage(newUpdate);
    };

    var shortHandler = function shortHandler(bot, update) {
        var newUpdate = R.clone(update);
        newUpdate.message.text = 'Hello. <buttons>I am in a relationship, I am not in a relationship, Its Complicated,,</buttons>';
        bot.sendMessage(newUpdate);
    };

    beforeEach(function () {
        return botmaster().then(function (botmaster) {
            myTelegramMock = telegramMock(botmaster);
            myBotmaster = botmaster;
            myBotmaster.on('error', function (bot, error) {
                if (error.message.indexOf('No response after fulfill or response is not a string') == -1 && error.message.indexOf('Response is empty after trimming') == -1) {
                    console.log(error);
                }
            });
            sessionWare = SessionWare();
        });
    });

    it('it should show text buttons', function (done) {
        myBotmaster.use('incoming', sessionWare.incoming);
        bootstrap(myBotmaster, buttonWareOptions);
        myBotmaster.use('incoming', mainHandler);
        myBotmaster.use('outgoing', sessionWare.outgoing);

        myBotmaster.on('error', function (bot, error) {
            return done(new Error('botmaster error: ' + error));
        });
        myTelegramMock.expect(['Hello.', '1. I am in a relationship', '2. I am not in a relationship', '3. Its Complicated'], done).sendUpdate('hi bob', function (err) {
            if (err) done(new Error('supertest error: ' + err));
        });
    });

    it('it should show text buttons when using the shorthand <buttons>', function (done) {
        myBotmaster.use('incoming', sessionWare.incoming);
        bootstrap(myBotmaster, buttonWareOptions);
        myBotmaster.use('incoming', shortHandler);
        myBotmaster.use('outgoing', sessionWare.outgoing);
        myBotmaster.on('error', function (bot, error) {
            return done(new Error('botmaster error: ' + error));
        });
        myTelegramMock.expect(['Hello.', '1. I am in a relationship', '2. I am not in a relationship', '3. Its Complicated'], done).sendUpdate('hi bob', function (err) {
            if (err) done(new Error('supertest error: ' + err));
        });
    });

    it('it should match text buttons and use the action to fulfill it', function (done) {

        myBotmaster.use('incoming', sessionWare.incoming);
        bootstrap(myBotmaster, buttonWareOptions);
        myBotmaster.use('incoming', mainHandler);
        myBotmaster.use('outgoing', sessionWare.outgoing);
        myTelegramMock.expect(['Hello.', '1. I am in a relationship', '2. I am not in a relationship', '3. Its Complicated'], function (err) {
            if (err) done(new Error('supertest error: ' + err));
            myTelegramMock.expect(['1. It\'s complicated because we want it to be that way.', '2. It\'s complicated because life is complicated.', '3. Mind your own business.'], done).sendUpdate('3.', function (err) {
                if (err) done(new Error('supertest error: ' + err));
            });
        }).sendUpdate('hi bob', function (err) {
            if (err) done(new Error('supertest error: ' + err));
        });
    });

    it('it should match text buttons and send the payload to the main handler', function (done) {

        myBotmaster.use('incoming', sessionWare.incoming);
        bootstrap(myBotmaster, buttonWareOptions);
        myBotmaster.use('incoming', function (bot, update, next) {
            if (update.message.text == 'hi bob') {
                next();
            } else {
                update.message.text.should.equal('I am not in a relationship');
                done();
            }
        });
        myBotmaster.use('incoming', mainHandler);
        myBotmaster.use('outgoing', sessionWare.outgoing);
        myTelegramMock.expect(['Hello.', '1. I am in a relationship', '2. I am not in a relationship', '3. Its Complicated'], function (err) {
            if (err) done(new Error('supertest error: ' + err));
            myTelegramMock.sendUpdate('2.', function (err) {
                if (err) done(new Error('supertest error: ' + err));
            });
        }).sendUpdate('hi bob', function (err) {
            if (err) done(new Error('supertest error: ' + err));
        });
    });

    it('it should not match two messages down', function (done) {

        myBotmaster.use('incoming', sessionWare.incoming);
        bootstrap(myBotmaster, buttonWareOptions);
        myBotmaster.use('incoming', function (bot, update, next) {
            if (update.message.text == 'I am not in a relationship') {
                bot.reply(update, 'Too bad for you!');
            } else {
                next();
            }
        });
        myBotmaster.use('incoming', mainHandler);
        myBotmaster.use('outgoing', sessionWare.outgoing);
        myTelegramMock.expect(['Hello.', '1. I am in a relationship', '2. I am not in a relationship', '3. Its Complicated'], function (err) {
            if (err) done(new Error('supertest error: ' + err));
            myTelegramMock.expect(['Too bad for you!'], function (err) {
                if (err) return done(new Error('supertest error: ' + err));
                myTelegramMock.expect(['Hello.', '1. I am in a relationship', '2. I am not in a relationship', '3. Its Complicated'], function () {}).sendUpdate('1', done);
            }).sendUpdate('2', function (err) {
                if (err) done(new Error('supertest error: ' + err));
            });
        }).sendUpdate('hi bob', function (err) {
            if (err) done(new Error('supertest error: ' + err));
        });
    });

    it('it should not match three messages down', function (done) {

        myBotmaster.use('incoming', sessionWare.incoming);
        bootstrap(myBotmaster, buttonWareOptions);
        myBotmaster.use('incoming', function (bot, update, next) {
            if (update.message.text == 'hi bob' || update.message.text == 'I am not in a relationship') {
                next();
            } else if (update.message.text == 'boo') {
                done();
            } else {
                done('did not get \'boo\', got ' + update.message.text);
            }
        });
        myBotmaster.use('incoming', mainHandler);
        myBotmaster.use('outgoing', sessionWare.outgoing);
        myTelegramMock.expect(['Hello.', '1. I am in a relationship', '2. I am not in a relationship', '3. Its Complicated'], function (err) {
            if (err) done(new Error('supertest error: ' + err));
            myTelegramMock.expect(['Hello.', '1. I am in a relationship', '2. I am not in a relationship', '3. Its Complicated'], function (err) {
                if (err) return done(new Error('supertest error: ' + err));
                myTelegramMock.expect([], function () {
                    return done('did not expect to get a response');
                }).sendUpdate('boo', function () {});
            }).sendUpdate('2', function (err) {
                if (err) done(new Error('supertest error: ' + err));
            });
        }).sendUpdate('hi bob', function (err) {
            if (err) done(new Error('supertest error: ' + err));
        });
    });

    it('it should not match four messages down', function (done) {

        myBotmaster.use('incoming', sessionWare.incoming);
        bootstrap(myBotmaster, buttonWareOptions);
        myBotmaster.use('incoming', function (bot, update, next) {
            if (update.message.text == 'hi bob' || update.message.text == 'I am not in a relationship') {
                next();
            } else if (update.message.text == 'boo') {
                done();
            } else {
                done('did not get \'boo\', got ' + update.message.text);
            }
        });
        myBotmaster.use('incoming', mainHandler);
        myBotmaster.use('outgoing', sessionWare.outgoing);
        myTelegramMock.expect(['Hello.', '1. I am in a relationship', '2. I am not in a relationship', '3. Its Complicated'], function (err) {
            if (err) done(new Error('supertest error: ' + err));
            myTelegramMock.expect(['Hello.', '1. I am in a relationship', '2. I am not in a relationship', '3. Its Complicated'], function (err) {
                if (err) return done(new Error('supertest error: ' + err));
                myTelegramMock.expect(['Hello.', '1. I am in a relationship', '2. I am not in a relationship', '3. Its Complicated'], function (err) {
                    return done(err);
                }).sendUpdate('2', function () {});
            }).sendUpdate('2', function (err) {
                if (err) done(new Error('supertest error: ' + err));
            });
        }).sendUpdate('hi bob', function (err) {
            if (err) done(new Error('supertest error: ' + err));
        });
    });

    it('should ask for confirmation when there are multiple options', function (done) {

        myBotmaster.use('incoming', sessionWare.incoming);
        bootstrap(myBotmaster, buttonWareOptions);
        myBotmaster.use('incoming', mainHandler);
        myBotmaster.use('outgoing', sessionWare.outgoing);
        //myBotmaster.on('error', (bot, error) => done(new Error(`botmaster error: ${error.stack}`)));
        myTelegramMock.expect(['Hello.', '1. I am in a relationship', '2. I am not in a relationship', '3. Its Complicated'], function (err) {
            if (err) done(new Error('supertest error: ' + err));
            myTelegramMock.expect([buttonWareOptions.confirmText, '1. I am in a relationship', '2. I am not in a relationship'], done).sendUpdate('I am', function (err) {
                if (err) done(new Error('supertest error: ' + err));
            });
        }).sendUpdate('hi bob', function (err) {
            if (err) done(new Error('supertest error: ' + err));
        });
    });

    it('should let the user confirm after selecting multiple options', function (done) {

        myBotmaster.use('incoming', sessionWare.incoming);
        bootstrap(myBotmaster, buttonWareOptions);
        myBotmaster.use('incoming', function (bot, update, next) {
            if (update.message.text == 'I am not in a relationship') {
                done();
            } else {
                next();
            }
        });
        myBotmaster.use('incoming', mainHandler);
        myBotmaster.use('outgoing', sessionWare.outgoing);
        //myBotmaster.on('error', (bot, error) => done(new Error(`botmaster error: ${error.stack}`)));
        myTelegramMock.expect(['Hello.', '1. I am in a relationship', '2. I am not in a relationship', '3. Its Complicated'], function (err) {
            if (err) done(new Error('supertest error: ' + err));
            myTelegramMock.expect([buttonWareOptions.confirmText, '1. I am in a relationship', '2. I am not in a relationship'], function (err) {
                if (err) done(new Error('supertest error: ' + err));
                myTelegramMock.expect([]).sendUpdate('2', function (err) {
                    if (err) done(new Error('supertest error: ' + err));
                });
            }).sendUpdate('I am', function (err) {
                if (err) done(new Error('supertest error: ' + err));
            });
        }).sendUpdate('hi bob', function (err) {
            if (err) done(new Error('supertest error: ' + err));
        });
    });

    afterEach(function (done) {
        this.retries(4);
        process.nextTick(function () {
            myTelegramMock.cleanAll();
            myBotmaster.server.close(done);
        });
    });
});
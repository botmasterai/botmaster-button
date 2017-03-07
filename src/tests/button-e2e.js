const R = require('ramda');
const {bootstrap} = require('../');
const {
    botmaster,
    telegramMock
} = require('botmaster-test');
const SessionWare = require('botmaster-session-ware');
require('should');

describe('botmaster-button', () => {
    let myBotmaster;
    let myTelegramMock;
    let sessionWare;
    const actions = {
        itsComplicated: {
            controller: () => `
                <button>It's complicated because we want it to be that way.</button>
                <button>It's complicated because life is complicated.</button>
                <button>Mind your own business.</button>
            `
        }
    };
    const buttonWareOptions = {
        actions,
        sessionPath: 'session',
        confirmText: 'I am sorry I got multiple matches, can you please confirm.',
    };
    const mainHandler = (bot, update) => {
        const newUpdate = R.clone(update);
        newUpdate.message.text = `
            Hello.
            <button image='https://images/ring.png'>I am in a relationship</button>
            <button>I am not in a relationship</button>
            <button title='3. Its Complicated'><itsComplicated /></button>`.replace(/\s+/g, ' ');
        bot.sendMessage(newUpdate);
    };

    const shortHandler = (bot, update) => {
        const newUpdate = R.clone(update);
        newUpdate.message.text = 'Hello. <buttons>I am in a relationship, I am not in a relationship, Its Complicated,,</buttons>';
        bot.sendMessage(newUpdate);
    };

    beforeEach(function() {
        return botmaster().then(botmaster => {
            myTelegramMock = telegramMock(botmaster);
            myBotmaster = botmaster;
            myBotmaster.on('error', (bot, error) => {
                if (
                    error.message.indexOf('No response after fulfill or response is not a string') == -1 &&
                    error.message.indexOf('Response is empty after trimming') == -1
                ) {
                    console.log(error);
                }
            });
            sessionWare = SessionWare();
        });
    });

    it('it should show text buttons', function(done) {
        myBotmaster.use('incoming', sessionWare.incoming);
        bootstrap(myBotmaster, buttonWareOptions);
        myBotmaster.use('incoming', mainHandler);
        myBotmaster.use('outgoing', sessionWare.outgoing);

        myBotmaster.on('error', (bot, error) => done(new Error(`botmaster error: ${error}`)));
        myTelegramMock
            .expect([
                'Hello.',
                '1. I am in a relationship',
                '2. I am not in a relationship',
                '3. Its Complicated'
            ], done)
            .sendUpdate('hi bob', err => {
                if (err) done(new Error('supertest error: ' + err));
            });

    });

    it('it should show text buttons when using the shorthand <buttons>', function(done) {
        myBotmaster.use('incoming', sessionWare.incoming);
        bootstrap(myBotmaster, buttonWareOptions);
        myBotmaster.use('incoming', shortHandler);
        myBotmaster.use('outgoing', sessionWare.outgoing);
        myBotmaster.on('error', (bot, error) => done(new Error(`botmaster error: ${error}`)));
        myTelegramMock
            .expect([
                'Hello.',
                '1. I am in a relationship',
                '2. I am not in a relationship',
                '3. Its Complicated'
            ], done)
            .sendUpdate('hi bob', err => {
                if (err) done(new Error('supertest error: ' + err));
            });

    });

    it('it should match text buttons and use the action to fulfill it', function(done) {

        myBotmaster.use('incoming', sessionWare.incoming);
        bootstrap(myBotmaster, buttonWareOptions);
        myBotmaster.use('incoming', mainHandler);
        myBotmaster.use('outgoing', sessionWare.outgoing);
        myTelegramMock
            .expect([
                'Hello.',
                '1. I am in a relationship',
                '2. I am not in a relationship',
                '3. Its Complicated',

            ], (err) => {
                if (err) done(new Error('supertest error: ' + err));
                myTelegramMock
                    .expect([
                        '1. It\'s complicated because we want it to be that way.',
                        '2. It\'s complicated because life is complicated.',
                        '3. Mind your own business.'
                    ], done).sendUpdate('3.', err => {
                        if (err) done(new Error('supertest error: ' + err));
                    });
            })
            .sendUpdate('hi bob', err => {
                if (err) done(new Error('supertest error: ' + err));
            });

    });

    it('it should match text buttons and send the payload to the main handler', function(done) {

        myBotmaster.use('incoming', sessionWare.incoming);
        bootstrap(myBotmaster, buttonWareOptions);
        myBotmaster.use('incoming', (bot, update, next) => {
            if (update.message.text == 'hi bob') {
                next();
            } else {
                update.message.text.should.equal('I am not in a relationship');
                done();
            }
        });
        myBotmaster.use('incoming', mainHandler);
        myBotmaster.use('outgoing', sessionWare.outgoing);
        myTelegramMock
            .expect([
                'Hello.',
                '1. I am in a relationship',
                '2. I am not in a relationship',
                '3. Its Complicated',

            ], (err) => {
                if (err) done(new Error('supertest error: ' + err));
                myTelegramMock
                    .sendUpdate('2.', err => {
                        if (err) done(new Error('supertest error: ' + err));
                    });
            })
            .sendUpdate('hi bob', err => {
                if (err) done(new Error('supertest error: ' + err));
            });

    });

    it('it ask for confirmation when there are multiple options', function(done) {

        myBotmaster.use('incoming', sessionWare.incoming);
        bootstrap(myBotmaster, buttonWareOptions);
        myBotmaster.use('incoming', mainHandler);
        myBotmaster.use('outgoing', sessionWare.outgoing);
        //myBotmaster.on('error', (bot, error) => done(new Error(`botmaster error: ${error.stack}`)));
        myTelegramMock
            .expect([
                'Hello.',
                '1. I am in a relationship',
                '2. I am not in a relationship',
                '3. Its Complicated'
            ], (err) => {
                if (err) done(new Error('supertest error: ' + err));
                myTelegramMock
                    .expect([
                        buttonWareOptions.confirmText,
                        '1. I am in a relationship',
                        '2. I am not in a relationship',
                    ], done).sendUpdate('I am', err => {
                        if (err) done(new Error('supertest error: ' + err));
                    });
            })
            .sendUpdate('hi bob', err => {
                if (err) done(new Error('supertest error: ' + err));
            });

    });

    afterEach(function(done) {
        this.retries(4);
        process.nextTick(() => {
            myTelegramMock.cleanAll();
            myBotmaster.server.close(done);
        });
    });
});

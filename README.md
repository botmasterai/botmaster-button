UNTESTED - Please don't use

# Botmaster Button

Easy cross-platform quick-reply buttons, even on those where only plain text is supported.

## Quick start
```js
const Botmaster = require('botmaster');
const myBotmasterSettings = require('./my-botmaster-settings');
const {bootstrap} = require('botmaster-button');

const botmaster = new Botmaster(myBotmasterSettings);
const actions = {
    itsComplicated = {
        controller: () => `
            <button>It's complicated because we want it to be that way.</button>
            <button>It's complicated because life is complicated.</button>
            <button>Mind your own business.</button>
        `
    }
}
bootstrap(botmaster, {
    actions,
    sessionPath: 'context',
    confirmText: 'I am sorry I got multiple matches, can you please confirm.',
    mainHandler: (bot, update) => bot.reply(update, `Could you please tell me about your relationship status?
        <button image='https://images/ring.png'>I'm in a relationship</button>
        <button>I'm not in a relationship.</button>
        <button title='3. Its Complicated'><itsComplicated /></button>
    `)
});
```

User sees in plain text channel:
```
1. I'm in a relationship
2. I'm not in a relationship
3. Its Complicated
```

They type "3." then they get:
```
1. It's complicated because we want it to be that way.
2. It's complicated because life is complicated.
3. Mind your own business.
```

User sees in messenger:

TODO

## Introduction

This package demonstrates the sandwich pattern for botmaster.

It provides:
* incoming middleware to enrich the session with matched buttons through fuzzy matching
* a handler that forwards the button to outgoing middleware if its an action or to the main handler if not
* outgoing middleware that uses either the standard quick reply format for channels that support it or by giving numbered text options and storing the payload in context.

You can use one or all of these.

## More involved example with your own handler
```js
const R = require('ramda');
const Botmaster = require('botmaster');
const {EnrichIncomingWare} = require('botmaster-enrich');
const {fulfillOutgoingWare} = require('botmaster-fulfill');
const {ButtonAction, ButtonEnricher, ButtonHandler} = require('botmaster-button');
const myBotmasterSettings = require('./my-botmaster-settings');
const otherActions = require('my-other-actions');
const handler = require('my-handler');

const botmaster = new Botmaster(myBotmasterSettings);

const buttonAction = ButtonAction({sessionPath: 'context'});
const actions = R.merge({button: buttonAction}, otherActions);
const buttonEnricher = ButtonEnricher({actions});

botmaster.use('incoming', EnrichIncomingWare({buttonEnricher}));

botmaster.on('update', ButtonHandler({mainHandler: handler}));

botmaster.use('outgoing', fulfillOutgoingWare({actions}))
```


# Overview
These buttons work by default through the standard quick-reply functionality where available in a bot class. (Such as in Facebook messenger)

If however the quick reply functionality is not available and you supply `sessionPath` in the `ButtonAction` options then the payload is stored through session storage and the user is expected to enter a keyword in the title which will generate the resulting payload.

Buttons can contain actions which will be evaluated before your update handlers if you pass an `actions` property to `ButtonEnricher` of actions that can performed on user input.

The title if not provided will default to the position that the button appears in the text followed by the payload.

## API
### Button tag
 Parameter | Description
---|---
inner tag content | The payload of the button. This is the input that botmaster will receive when the user clicks or signals the button
image | url to an image for platforms that support images
title | the text that the user sees as the button

### Button context
#### session
Path | Description
---|---
button.multiple | if true there are multiple button matches for the user's input
button.matches | when there are multiple matches they are placed here. Each entry is a button object
button | when there are not multiple matches button is a single button object.
buttonPayloads | incoming buttons, these are removed after the button enricher is processed. Each entry follows the button object pattern

#### button object
Property | Description
---|---
payload | the text to pass to the update handler
title | the text the user saw - the text to fuzzy match against
image | the url for an image for the button

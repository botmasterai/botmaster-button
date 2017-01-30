# Button action and enricher

UNTESTED - Please don't use

This package provides a botmaster-fulfill action and a botmaster-enrich enricher to aid with the use of buttons.

Code:
```js
const R = require('ramda');
const Botmaster = require('botmaster');
const myBotmasterSettings = require('my-botmaster-settings');
const {enrichIncomingWare} = require('botmaster-enrich');
const {fulfillOutgoingWare} = require('botmaster-fulfill');
const {ButtonAction, ButtonEnricher} = require('botmaster-button');
const otherActions = require('my-other-actions');
const handler = require('my-handler');

const botmaster = new Botmaster(myBotmasterSettings);

const buttonAction = ButtonAction({sessionProp: 'context'});
const actions = R.merge({button: buttonAction}, otherActions);
const buttonEnricher = ButtonEnricher({actions});

botmaster.use('incoming', enrichIncomingWare({buttonEnricher}));

botmaster.on('update', handler);

botmaster.use('outgoing', fulfillOutgoingWare({actions}))
```

Dialog:
```xml
<button image='https://immages/ring.png'>I'm in a relationship</button>
<button>I'm not in a relationship.</button>
<button title='3. Its Complicated'><itsComplicated /></button>
```

User sees:
```
1. I'm in a relationship
2. I'm not in a relationship
3. Its Complicated
```

These buttons work by default through the standard quick-reply functionality where available in a bot class. (Such as in Facebook messenger)

If however the quick reply functionality is not available and you supply `sessionProp` in the `ButtonAction` options then the payload is stored through session storage and the user is expected to enter a keyword in the title which will generate the resulting payload.

Buttons can contain actions which will be evaluated before your update handlers if you pass an `actions` property to `ButtonEnricher` of actions that can performed on user input.

The title if not provided will default to the position that the button appears in the text followed by the payload.

Button tag parameters:
| Parameter | Description |
|-- |-- |
| inner tag content | The payload of the button. This is the input that botmaster will receive when the user clicks or signals the button |
| image | url to an image for platforms that support images |
| title | the text that the user sees as the button |

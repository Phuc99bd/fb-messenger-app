# Facebook Messenger Platform App

#### NodeJS API adapter
[![npm](https://img.shields.io/npm/v/npm.svg)](https://www.npmjs.com/package/fb-messenger-app) [![npm](https://img.shields.io/github/license/mashape/apistatus.svg)](LICENSE) 
## Installation

```bash
npm install fb-messenger-app
```

## API

##### Constructor

```js
var MessengerApp = require('fb-messenger-app')
var messenger = new MessengerApp(token[, notificationType])
```
_token_ must be your page token.

##### Functions

```js
messenger.sendTextMessage(id, stringMessage[, notificationType][, cb])

messenger.sendImageMessage(recipientId, imgUrl[, notificationType][, cb])

messenger.sendAudioMessage(recipientId, audioUrl[, notificationType][, cb])

messenger.sendVideoMessage(recipientId, videoUrl[, notificationType][, cb])

messenger.sendFileMessage(recipientId, fileUrl[, notificationType][, cb])

messenger.sendButtonMessage(recipientId, buttonTemplate, buttons[, notificationType][, cb])

messenger.sendGenericMessage(recipientId, elements[, notificationType][, cb])

messenger.sendReceiptMessage(recipientId, receipt[, notificationType][, cb])

messenger.sendQuickMessage(recipientId, quickReplies[, notificationType][, cb])

messenger.sendItineraryMessage(recipientId, itinerary[, notificationType][, cb])

messenger.sendCheckinMessage(recipientId, checkin[, notificationType][, cb])

messenger.sendBoardingpassMessage(recipientId, boardingpass[, notificationType][, cb])

messenger.sendFlightupdateMessage(recipientId, flightupdate[, notificationType][, cb])

messenger.sendApiMessage(recipientId, message[, notificationType][, cb])

messenger.sendSenderAction(recipientId, senderAction[, cb])

messenger.setGreetingText(message[, cb])

messenger.setGetStartedButton(message[, cb])

messenger.deleteGetStartedButton([cb])

messenger.setPersistentMenu(items[, cb])

messenger.deletePersistentMenu([cb])

messenger.sendThreadSettingsRequest([cb])

messenger.getUserProfile(userId[, cb])
```

#### Notification Types

Notification Types are optional; by default, messages will be _REGULAR_ push notification type
 - REGULAR : will emit a sound/vibration and a phone notification
 - SILENT_PUSH : will just emit a phone notification
 - NO_PUSH : will not emit either

#### Sender Actions

Set typing indicators or send read receipts.
- mark_seen : Mark last message as read
- typing_on : Turn typing indicators on
- typing_off : Turn typing indicators off

## Examples

### Basic Example

```js
TODO
```

### Callback Example

```js
TODO
```

### No push Example

```js
TODO
```

### Default to silent push Example

```js
TODO
```

### Complete Example

```js
TODO
```

## License

### Code

[MIT License](https://github.com/charlesaraya/fb-messenger-app/blob/master/LICENSE).
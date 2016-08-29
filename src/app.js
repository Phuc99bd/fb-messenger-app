import request from 'request'

const apiUrl = 'https://graph.facebook.com/v2.6/'

/* TODO
 * - Closing the browser. (Read at https://developers.facebook.com/docs/messenger-platform/send-api-reference/button-template#close_window)
 * - Control Error of functin params
 * - Tests
 * - Send API request fails. Internal Errors, Rate Limited Errors, Bad Parameter Errors, Access Token Errors, Permission Errors, User Block Errors, Account Linking Errors. read more at https://developers.facebook.com/docs/messenger-platform/send-api-reference#errors
 */

/** Class representing a Facebook Messenger App. */
class Messenger {
  /**
   * Create a Messenger.
   *
   * @param {string} [token=null] - The Facebook Page Access Token.
   * @param {string} [notificationType=REGULAR] - The default message notification type.
   */
  constructor (token = null, notificationType = 'REGULAR') {
    this.token = token
    this.notificationType = notificationType

    if (!this.token) throw new Error('Facebook Page access token is missing.')
  }

   /**
   * This method will subscribe App via API
   *
   * @callback [cb] - The callback function
   */
  subscribeApp (cb) {
    const req = {
      url: `${apiUrl}me/subscribed_apps`,
      qs: {
        access_token: this.token
      },
      method: 'POST',
      json: true
    }
    sendRequest(req, cb)
  }

   /**
   * This method is called when an Authentication Event occurs.
   *
   * @param {object} event - The authentication event
   */
  receivedAuthentication (event) {
    var sender = event.sender.id
    var recipient = event.recipient.id
    var timeOfAuth = event.timestamp
    var passThroughParam = event.optin.ref

    console.log(`Authentication received for user ${sender} and page ${recipient} 
      with pass-through param ${passThroughParam} at ${timeOfAuth}`)
  }

   /**
   * This method is called when a Message Event occurs.
   *
   * @param {object} event - The message event
   */
  receivedMessage (event) {
    var sender = event.sender.id
    var recipient = event.recipient.id
    var timeOfMessage = event.timestamp
    var message = event.message
    var mid = message.mid
    var seq = message.seq

    let isEcho = message.is_echo
    let metadata = message.metadata
    let appId = message.app_id
    let quickReply = message.quick_reply
    let text = message.text
    let attachment = message.attachments

    // When a message has been send BY your page
    if (isEcho) {
      console.log(`${seq}-${mid}-${timeOfMessage}: Received echo message from app 
        ${appId}, page ${sender} and user ${recipient} with metadata ${metadata}`)
      return
    } else if (quickReply) {
      let quickReplyPayload = quickReply.payload

      console.log(`${seq}-${mid}-${timeOfMessage}: Quick reply received from 
        user ${sender} and page ${recipient} with text ${text} and payload 
        ${quickReplyPayload}`)
      return
    }
    // When a message has been send TO your page
    if (text) {
      console.log(`${seq}-${mid}-${timeOfMessage}: Received message from user 
        ${sender} and page ${recipient} with  text ${text}`)
    } else if (attachment) {
      let attachmentType = message.attachments[0].type

      console.log(`${seq}-${mid}-${timeOfMessage}: Received message from user 
        ${sender} and page ${recipient} with attachment of type ${attachmentType}`)
    }
  }

   /**
   * This method is called when a Delivery Confirmation Event occurs.
   *
   * @param {object} event - The delivery confirmation event
   */
  receivedDeliveryConfirmation (event) {
    var sender = event.sender.id
    var recipient = event.recipient.id
    var mids = event.delivery.mids
    var watermark = event.delivery.watermark
    var seq = event.delivery.seq

    if (mids) {
      mids.forEach((mid) => {
        console.log(`Received delivery confirmation from user ${sender} and page 
          ${recipient} with mid ${mid} and sequence #${seq}`)
      })
    }
    console.log(`All messages before ${watermark} were delivered`)
  }

   /**
   * This method is called when a Postback Event occurs.
   *
   * @param {object} event - The postback event
   */
  receivedPostback (event) {
    var sender = event.sender.id
    var recipient = event.recipient.id
    var timeOfPostback = event.timestamp
    var payload = event.postback.payload

    console.log(`Received postback for user ${sender} and page ${recipient} with 
      payload ${payload} at ${timeOfPostback}`)
  }

   /**
   * This method is called when a Message Read Event occurs.
   *
   * @param {object} event - The message read event
   */
  receivedReadConfirmation (event) {
    var sender = event.sender.id
    var recipient = event.recipient.id
    var timeOfRead = event.timestamp
    var watermark = event.read.watermark
    var seq = event.read.seq

    console.log(`${seq}-${timeOfRead}: All Messages were read from user ${sender} 
      and page ${recipient} before ${watermark}`)
  }

   /**
   * This method is called when a Message Account linking Event occurs.
   *
   * @param {object} event - The message account linking event
   */
  receivedAccountLinking (event) {
    var sender = event.sender.id
    var recipient = event.recipient.id
    var timeOfLink = event.timestamp
    var status = event.account_linking.status

    if (status === 'linked') {
      let authCode = event.account_linking.authorization_code
      console.log(`${timeOfLink}: The user ${sender} and page ${recipient} has 
        linked his account with authorization code ${authCode}`)
    }
    if (status === 'unlinked') {
      console.log(`${timeOfLink}: The user ${sender} and page ${recipient} has 
        unlinked his account`)
    }
  }

   /**
   * This method handles all the POST calls sent to our webhook.
   *
   * @param {object} response - The response that will be sent to facebook
   * @param {object} data - The data received at our webhook
   * @callback [cb] - The callback function
   */
  messageDispatcher (response, data, cb) {
    // Check that this is a page subscription
    if (data.object === 'page') {
      // Iterate over each entry - There may be multiple if batched
      data.entry.forEach((pageEntry) => {
        var pageId = pageEntry.id
        var timeOfEvent = pageEntry.time

        console.log(`New message event from page ${pageId} at ${timeOfEvent}`)
        // Iterate over each messaging event
        pageEntry.messaging.forEach((event) => {
          if (event.message) {
            this.receivedMessage(event)
          } else if (event.optin) {
            this.receivedAuthentication(event)
          } else if (event.delivery) {
            this.receivedDeliveryConfirmation(event)
          } else if (event.postback) {
            this.receivedPostback(event)
          } else if (event.read) {
            this.receivedReadConfirmation(event)
          } else if (event.account_linking) {
            this.receivedAccountLinking(event)
          } else {
            console.log('Webhook received an unknown messaging event: ', event)
          }
        })
      })
    }
    // If all went well, send back a 200 (within 20 seconds) to let FB know you've
    // successfully received the callback. Otherwise, the request will time out.
    response.sendStatus(200)
  }

   /**
   * This method will send a plain Text Message.
   *
   * @param {string} recipient - The user id that will receive the message
   * @param {string} text - The text message (required)
   * @param {string} [notificationType] - The notification type
   * @callback [cb] - The callback function
   */
  sendTextMessage (recipient, text, notificationType, cb) {
    var message = {
      text: text
    }
    this.sendApiMessage(recipient, message, notificationType, cb)
  }

   /**
   * This method will send a file attachment. The file type must be image, audio, video or file).
   * Image supported formats [jpg, png and gifs]
   *
   * @param {string} recipient - The user id to whom we're sending the text message
   * @param {string} fileType - The file type (required) ['image', 'audio', 'video' or 'file']
   * @param {string} fileUrl - The file url where it is hosted (required)
   * @param {string} [notificationType] - The notification type
   * @callback [cb] - The callback function
   */
  sendFileMessage (recipient, fileType, fileUrl, notificationType, cb) {
    var message = {
      attachment: {
        type: fileType,
        payload: {
          url: fileUrl
        }
      }
    }
    this.sendApiMessage(recipient, message, notificationType, cb)
  }

   /**
   * This method will send a text and buttons attachment to request input from the user.
   * The buttons can open a URL, or make a back-end call to your webhook.
   *
   * @param {string} recipient - The user id to whom we're sending the text message
   * @param {string} text - The head text of the button message
   * @param {object[]} buttons - The Set of call-to-action buttons
   * @param {string} [notificationType] - The notification type
   * @callback [cb] - The callback function
   */
  sendButtonMessage (recipient, text, buttons, notificationType, cb) {
    // TODO: test buttons object
    var message = {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'button',
          text: text,
          buttons: buttons
        }
      }
    }
    this.sendApiMessage(recipient, message, notificationType, cb)
  }

   /**
   * This method will send a Structured Generic Message, to send a horizontal scrollable carousel of items,
   * each composed of an image attachment, short description and buttons to request input from the user.
   * The buttons can open a URL, or make a back-end call to your webhook.
   *
   * @param {string} recipient - The user id to whom we're sending the text message
   * @param {object[]} elements - The Data for each bubble in message
   * @param {string} [notificationType] - The notification type
   * @callback [cb] - The callback function
   */
  sendGenericMessage (recipient, elements, notificationType, cb) {
    // TODO: test elements object
    var message = {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: elements
        }
      }
    }
    this.sendApiMessage(recipient, message, notificationType, cb)
  }

   /**
   * This method will send a Receipt Message, to send a order confirmation,
   * with the transaction summary and description for each item.
   *
   * @param {string} recipient - The receipient user id.
   * @param {object} receipt - The Receipt Template
   * @param {string} receipt.recipient_name - The recipient's name.
   * @param {string} receipt.order_number - The order number (must be unique).
   * @param {string} receipt.currency - The currency for order.
   * @param {string} receipt.payment_method - The payment method details. Can be a custom string. ex: "Visa 1234"..
   * @param {string} [receipt.order_url] - The URL of the order.
   * @param {string} [receipt.timestamp] - The timestamp of the order, in seconds.
   * @param {object[]} receipt.elements - The items in order.
   * @param {object} [receipt.address] - The shipping address.
   * @param {object} receipt.summary - The payment summary.
   * @param {object[]} [receipt.adjustments] - The payment adjustments.
   * @param {string} [notificationType] - The notification type
   * @callback [cb] - The callback function
   */
  sendReceiptMessage (recipient, receipt, notificationType, cb) {
    // TODO: test the 'receipt' payload object
    var message = {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'receipt',
          recipient_name: receipt.recipient_name,
          order_number: receipt.order_number,
          currency: receipt.currency,
          payment_method: receipt.payment_method,
          order_url: receipt.order_url,
          timestamp: receipt.timestamp,
          elements: receipt.shopping_cart,
          address: receipt.address,
          summary: receipt.summary,
          adjustments: receipt.adjustments
        }
      }
    }
    this.sendApiMessage(recipient, message, notificationType, cb)
  }

   /**
   * This method will send a Quick Replies Message.
   *
   * @param {string} recipient - The user id to whom we're sending the text message
   * @param {string} text - The message text
   * @param {object[]} quickReplies - The quick replies to be sent with messages
   * @param {string} [notificationType] - The notification type
   * @callback [cb] - The callback function
   */
  sendQuickMessage (recipient, text, quickReplies, notificationType, cb) {
    // TODO: test quickReplies, test ({object} attachments|{string} text)
    var message = {
      text: text,
      quick_replies: quickReplies
    }
    this.sendApiMessage(recipient, message, notificationType, cb)
  }

   /**
   * This method will send an Airplane Itinerary Message, that contains the itinerary and receipt.
   *
   * @param {string} recipient - The user id to whom we're sending the text message
   * @param {object} itinerary - The payload of itinerary template (required)
   * @param {string} [notificationType] - The notification type
   * @callback [cb] - The callback function
   */
  sendItineraryMessage (recipient, itinerary, notificationType, cb) {
    // TODO: test itinerary Template
    var message = {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'airline_itinerary',
          intro_message: itinerary.intro_message,
          locale: itinerary.locale,
          theme_color: itinerary.theme_color,  // not required, RGB hexadecimal string (default #009ddc)
          pnr_number: itinerary.pnr_number,
          passenger_info: itinerary.passenger_info,  // array of passenger_info
          flight_info: itinerary.flight_info,  // array of flight_info
          passenger_segment_info: itinerary.passenger_segment_info,  // array of passenger_segment_info
          price_info: itinerary.price_info,  // array of price_info, not required, limited to 4
          base_price: itinerary.base_price,  // not required
          tax: itinerary.tax,  // not required
          total_price: itinerary.total_price,
          currency: itinerary.currency  // must be a three digit ISO-4217-3 code
        }
      }
    }
    this.sendApiMessage(recipient, message, notificationType, cb)
  }

   /**
   * This method will send an Airplane Check-In Reminder Message.
   *
   * @param {string} recipient - The user id to whom we're sending the text message
   * @param {object} checkin - The payload of checkin template (required)
   * @param {string} [notificationType] - The notification type
   * @callback [cb] - The callback function
   */
  sendCheckinMessage (recipient, checkin, notificationType, cb) {
    // TODO: test checkin Template
    var message = {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'airline_checkin',
          intro_message: checkin.intro_message,
          locale: checkin.locale,
          theme_color: checkin.theme_color,  // not required
          pnr_number: checkin.pnr_number,
          flight_info: checkin.flight_info,  // array of flight info
          checkin_url: checkin.checkin_url
        }
      }
    }
    this.sendApiMessage(recipient, message, notificationType, cb)
  }

   /**
   * This method will send an Airplane Boarding Pass Message, that contains boarding
   * passes for one or more flights or one more passengers
   *
   * @param {string} recipient - The user id to whom we're sending the text message
   * @param {object} boardingpass - The payload of boarding pass template (required)
   * @param {string} [notificationType] - The notification type
   * @callback [cb] - The callback function
   */
  sendBoardingpassMessage (recipient, boardingpass, notificationType, cb) {
    // TODO: test boardingpass payload.
    var message = {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'airline_boardingpass',
          intro_message: boardingpass.intro_message,
          locale: boardingpass.locale,
          theme_color: boardingpass.theme_color,  // not required
          boarding_pass: boardingpass.boarding_pass  // array of boarding_pass
        }
      }
    }
    this.sendApiMessage(recipient, message, notificationType, cb)
  }

   /**
   * This method will send an Airplane Flight Update Message.
   *
   * @param {string} recipient - The user id to whom we're sending the text message
   * @param {object} flightupdate - The payload of flight update template (required)
   * @param {string} [notificationType] - The notification type
   * @callback [cb] - The callback function
   */
  sendFlightupdateMessage (recipient, flightupdate, notificationType, cb) {
    // TODO: test flightupdate payload.
    var message = {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'airline_update',
          intro_message: flightupdate.intro_message,
          update_type: flightupdate.update_type,
          locale: flightupdate.locale,
          theme_color: flightupdate.theme_color,  // not required
          pnr_number: flightupdate.pnr_number,
          update_flight_info: {
            flight_number: flightupdate.update_flight_info.flight_number,
            departure_airport: {
              airport_code: flightupdate.update_flight_info.departure_airport.airport_code,
              city: flightupdate.update_flight_info.departure_airport.city,
              terminal: flightupdate.update_flight_info.departure_airport.terminal,
              gate: flightupdate.update_flight_info.departure_airport.gate
            },
            arrival_airport: {
              airport_code: flightupdate.update_flight_info.arrival_airport.airport_code,
              city: flightupdate.update_flight_info.arrival_airport.city,
              terminal: flightupdate.update_flight_info.arrival_airport.terminal,
              gate: flightupdate.update_flight_info.arrival_airport.gate
            },
            flight_schedule: {  // must be ISO 8601-based format
              boarding_time: flightupdate.update_flight_info.flight_schedule.boarding_time,  // not required
              departure_time: flightupdate.update_flight_info.flight_schedule.departure_time,
              arrival_time: flightupdate.update_flight_info.flight_schedule.arrival_time  // not required
            }
          }
        }
      }
    }
    this.sendApiMessage(recipient, message, notificationType, cb)
  }

   /**
   * This method will send a message to the user.
   *
   * @param {string} recipient - The user id to whom we're sending the text message
   * @param {object} message - The message object (required)
   * @param {string} [notificationType] - The notification type
   * @callback [cb] - The callback function
   */
  sendApiMessage (recipient, message, notificationType, cb) {
    // TODO: test message object
    if (typeof notificationType === 'function') {
      cb = notificationType
      notificationType = this.notificationType
    }
    /*
    if (!recipient.id && !recipient.phoneNumber) {
      throw new Error('Send API message error: recipient id or phone number must be set')
    }
    */
    const req = {
      url: `${apiUrl}me/messages`,
      qs: {
        access_token: this.token
      },
      method: 'POST',
      json: {
        recipient: {
          /*
          id: recipient.id || null,
          phone_number: recipient.phoneNumber || null
          */
          id: recipient // fix id/phone_number
        },
        message: message,
        notification_type: notificationType
      }
    }
    sendRequest(req, cb)
  }

   /**
   * This method will send Sender Actions, this are typing indicators or send read receipts,
   * to let the user know you are processing their request
   *
   * @param {string} recipient - The user id to whom we're sending the text message
   * @param {string} senderAction - The action typing indicator (required)
   * @callback [cb] - The callback function
   */
  sendSenderAction (recipient, senderAction, cb) {
    /*
    if (!recipient.id && !recipient.phoneNumber) {
      throw new Error('Sender action error: recipient id or phone number must be set')
    }
    */
    const req = {
      url: `${apiUrl}me/messages`,
      qs: {
        access_token: this.token
      },
      method: 'POST',
      json: {
        recipient: {
          /*
          id: recipient.id || null,
          phone_number: recipient.phoneNumber || null
          */
          id: recipient // fix recipient id/phone_number
        },
        sender_action: senderAction
      }
    }
    sendRequest(req, cb)
  }

   /**
   * This method will set a Greeting Text.
   *
   * @param {string} greeting - The greeting text
   * @callback [cb] - The callback function
   */
  setGreetingText (greeting, cb) {
    // TODO: test greeting object
    if (typeof greeting === 'string') {
      greeting = {text: greeting}
    }
    var method = 'POST'
    var params = {
      setting_type: 'greeting',
      greeting: greeting
    }
    this.sendThreadSettingsRequest(method, params, cb)
  }

   /**
   * This method will set a Get Started Button, in the welcome screen.
   *
   * @param {Array of payload} payload - The array of payload
   * @callback [cb] - The callback function
   */
  setGetStartedButton (payload, cb) {
    // TODO: test message (1+ payloads), button was succesfully set/succsefully removed?
    if (typeof payload === 'string') {  // Case a string is entered
      payload = [{
        payload: payload
      }]
    }
    var method = 'POST'
    var params = {
      setting_type: 'call_to_actions',
      thread_state: 'new_thread',
      call_to_actions: payload
    }
    this.sendThreadSettingsRequest(method, params, cb)
  }

   /**
   * This method will set a Persistent Menu, always available to the user.
   *
   * @param {Array of menu_item objects} menuItems - The menu items
   * @callback [cb] - The callback function
   */
  setPersistentMenu (menuItems, cb) {
    // TODO: test menuItems (menu_item object, etc.)
    var method = 'POST'
    var params = {
      setting_type: 'call_to_actions',
      thread_state: 'existing_thread',
      call_to_actions: menuItems
    }
    this.sendThreadSettingsRequest(method, params, cb)
  }

   /**
   * This method will delete a Thread Setting. Get Started Button('new_thread')
   * or Persistent Menu('existing_thread')
   *
   * @param {string} threadType - The thread type to be deleted
   * @callback [cb] - The callback function
   */
  deleteThreadSetting (threadType, cb) {
    // TODO: test threadType
    var method = 'DELETE'
    var params = {
      setting_type: 'call_to_actions',
      thread_state: threadType
    }
    this.sendThreadSettingsRequest(method, params, cb)
  }

   /**
   * This method will Configure the Thread Setting on Messenger.
   *
   * @param {string} method - The call request (POST or DELETE)
   * @param {object} params - The configuration parameters
   * @callback [cb] - The callback function
   */
  sendThreadSettingsRequest (method, params, cb) {
    const req = {
      url: `${apiUrl}me/thread_settings`,
      qs: {
        access_token: this.token
      },
      method: method,
      json: params
    }
    sendRequest(req, cb)
  }

   /**
   * This method will retrieve the user page-scoped ID (PSID) using the account
   * linking endpoint.
   *
   * @param {string} token - The account linking token
   * @callback [cb] - The callback function
   */
  getUserPsid (token, cb) {
    const req = {
      url: `${apiUrl}me`,
      qs: {
        access_token: this.token,
        fields: 'recipient',
        account_linking_token: token
      },
      method: 'GET',
      json: true
    }
    sendRequest(req, cb)
  }

   /**
   * This method will unlink the user account.
   *
   * @param {string} psid - A valid page-scoped ID (PSID)
   * @callback [cb] - The callback function
   */
  unlinkAccount (psid, cb) {
    const req = {
      url: `${apiUrl}me/unlink_accounts`,
      qs: {
        access_token: this.token
      },
      method: 'POST',
      json: {
        psid: psid
      }
    }
    sendRequest(req, cb)
  }

   /**
   * This method will send an account linking call-2-action to the user.
   *
   * @param {string} recipient - The user id to whom we're sending the text message
   * @param {string} title - The title of the account linking CTA
   * @param {string} imageUrl - The URL of the image in the account linking CTA
   * @param {string} serverUrl - The Authentication callback URL
   * @callback [cb] - The callback function
   */
  sendAccountLinking (recipient, title, imageUrl, serverUrl, cb) {
    var message = {
      attachment: {
        type: 'tempalte',
        payload: {
          template_type: 'generic',
          elements: [{
            title: title,
            image_url: imageUrl,
            buttons: [{
              type: 'account_link',
              url: `${serverUrl}/authorize`
            }]
          }]
        }
      }
    }
    this.sendApiMessage(recipient, message, cb)
  }

   /**
   * This method will get the User Profile, used to query more information about
   * the user, and personalize the experience further.
   *
   * @param {string} userId - The user id
   * @callback [cb] - The callback function
   */
  getUserProfile (userId, cb) {
    // TODO: test selected fields
    const req = {
      url: `${apiUrl}${userId}`,
      qs: {
        access_token: this.token,
        fields: 'first_name,last_name,profile_pic,locale,timezone,gender'
      },
      method: 'GET',
      json: true
    }
    sendRequest(req, cb)
  }
}

 /**
 * This method will send a Request to the Send API.
 *
 * @param {object} req - The request being send
 * @callback [cb] - The callback function
 */
const sendRequest = (req, cb) => {
  request(req, (error, response, body) => {
    if (!cb) return
    if (error) return cb(error)
    if (response.body.error) return cb(response.body.error)
    cb(null, response.body)
  })
}

export default Messenger

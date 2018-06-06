'use strict';

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: `SessionSpeechlet - ${title}`,
            content: `SessionSpeechlet - ${output}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession,
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}


// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = 'Welcome';
    const speechOutput = 'Sure. ' +
        'Please tell me how many digits game do you want to play by saying, 1 digit or 2 digits';
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'Please tell me how many digits game do you want to play by saying, 1 digit or 2 digits';
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    const cardTitle = 'Session Ended';
    const speechOutput = "'That's fine. You did a great job today. Keep it up!";
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

function createDigitAndAnswerAttributes(digit, firstNumber, secondNumber) {
   var answer = firstNumber * secondNumber;
    return {
        "digits" : digit,
        "answer" : answer
    };
}

function getFirstNumber(digit) {
    var x;
    if(digit == 1){
      x = Math.floor((Math.random() * 10) + 1);
    } else if (digit == 2){
      x = Math.floor(Math.random() * (20 - 1 + 1)) + 1;
    }
    return x;
}

function getSecondNumber(digit) {
    var y;
    if(digit == 1){
      y = Math.floor((Math.random() * 10) + 1);
    } else if (digit == 2){
      y = Math.floor(Math.random() * (20 - 1 + 1)) + 1;
    }
    return y;
}

/**
 * Sets the number of digits in the session and prepares the speech to reply to the user.
 */
function setDigitsInSession(intent, session, callback) {
    const cardTitle = intent.name;
    const digits = intent.slots.digits;
    let repromptText = '';
    let sessionAttributes = {};
    const shouldEndSession = false;
    let speechOutput = '';

    if (digits) {
        let digit = digits.value;
        var fN = getFirstNumber(digit);
        var sN = getSecondNumber(digit);
        speechOutput = "Okay, "+digit+" digit. Lets start. What is " + fN + " times " + sN + "?";
        repromptText = "Okay, "+digit+" digit. Lets start. What is " + fN + " times " + sN + "?";
        sessionAttributes = createDigitAndAnswerAttributes(digit, fN, sN);

    } else {
        speechOutput = "Sure, but how many digits you want to play?";
        repromptText = "Tell me how many digits game do you want to play by saying, 1 digit or 2 digits";
    }

    callback(sessionAttributes,
         buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function validateAnswerAndAskNextQuestion(intent, session, callback) {
    var digits;
    var answer;
    var userAnswer = intent.slots.answer.value;
    const repromptText = null;
    let sessionAttributes = {};
    let shouldEndSession = false;
    let speechOutput = '';

    if (session.attributes) {
        answer = session.attributes.answer;
        digits = session.attributes.digits;
    }

    if (digits) {
        if (answer) {
          console.log("Answer - "+answer);
          console.log("userAnswer - "+userAnswer);
          if(answer == userAnswer){
            var fN = getFirstNumber(digits);
            var sN = getSecondNumber(digits);
            speechOutput = "That's correct! What is "  + fN + " times " + sN + "?";
            sessionAttributes = createDigitAndAnswerAttributes(digits, fN, sN);
          } else {
            var fN = getFirstNumber(digits);
            var sN = getSecondNumber(digits);
            speechOutput = "That's not correct, but let's move on. What is "  + fN + " times " + sN + "?";
            sessionAttributes = createDigitAndAnswerAttributes(digits, fN, sN);
          }
        } else {
          var fN = getFirstNumber(digits);
          var sN = getSecondNumber(digits);
          speechOutput = "I am not sure I get that. Let's try another one. What is "  + fN + " times " + sN + "?";
        }
    } else {
        speechOutput = "I am not sure how many digits you want to play. Tell me how many digits game do you want to play by saying, 1 digit or 2 digits";
    }

    // Setting repromptText to null signifies that we do not want to reprompt the user.
    // If the user does not respond or says something that is not understood, the session
    // will end.
    callback(sessionAttributes,
         buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
}


// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'MyDigitsIntent') {
        setDigitsInSession(intent, session, callback);
    } else if (intentName === 'MyAnswerIntent') {
        validateAnswerAndAskNextQuestion(intent, session, callback);
    } else if (intentName === 'AMAZON.HelpIntent') {
        getWelcomeResponse(callback);
    } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        handleSessionEndRequest(callback);
    } else {
        throw new Error('Invalid intent');
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    // Add cleanup logic here
}


// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = (event, context, callback) => {
    try {
        console.log(`event.session.application.applicationId=${event.session.application.applicationId}`);

        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }
    } catch (err) {
        callback(err);
    }
};

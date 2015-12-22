( function( erlangc, $, window, document, undefined ) {

  // Enable strict mode
  'use strict';

  /* Private variables */
  var totalNumberOfCalls = 0;
  var timePeriodInSeconds = 0;
  var averageCallDuration = 0;
  var numberOfAgents = 0;
  var targetAnswerTime = 0;

  var averageArrivalRate = 0;
  var trafficIntensity = 0;
  var agentOccupancy = 0;
  var probabilityOfWaiting = 0;
  var averageSpeedOfAnswer = 0;
  var serviceLevel = 0;

  /* Private functions */
  /**
  * Calculates the Erlang-C formula using all available data.
  */
  function calculate() {

    // Average arrival rate in seconds = total number of calls / time period in seconds
    averageArrivalRate = timePeriodInSeconds > 0 ?
    totalNumberOfCalls / timePeriodInSeconds :
    0;

    // Traffic intensity = average arrival rate * average call duration
    trafficIntensity = averageArrivalRate * averageCallDuration;

    // Agent occupancy, or utilitization.
    // Calculated by dividing the traffic intesnity by the number of agents.
    // Gives you a number between 0 and 1 (multiply by 100 to get percentage).
    // If this value is greater than 1, then the agents are overloaded, and the
    // Erlang-C calculations are not meaningful, and may give negative waiting
    // times.
    // Translation: If the traffic is too heavy for the number of available
    // agents (the volume is greater than the number of agents available, then
    // the numerator is greater than the denominator), then this value is not
    // meaningful.
    agentOccupancy = numberOfAgents > 0 ?
    trafficIntensity / numberOfAgents :
    0;

    // Ec(m,u) = probability that a call is not answered immediately and has to
    // wait. This will be a decimal between 0 and 1.
    // Numerator in this formula is:
    // (traffic intensity ^ number of agents / number of agents factorial)
    // Sigma notation means for every number k from 0 to (number of agents - 1),
    // add (traffic intensity ^ k) / (k factorial)
    var powNumerator = numberOfAgents > 0 ?
    Math.pow( trafficIntensity, numberOfAgents ) /
    erlangc.factorial( numberOfAgents ) :
    0;
    var powDenominator = powNumerator +
    ( ( 1 - agentOccupancy ) * erlangSigma() );
    probabilityOfWaiting = powNumerator / powDenominator;

    // Average speed of answer (wait time, response time)
    // Tw = (probability of waiting * average call duration) /
    // (number of agents * (1 - agent occupancy))
    averageSpeedOfAnswer = numberOfAgents > 0 && agentOccupancy !== 1 ?
    ( probabilityOfWaiting * averageCallDuration ) /
    ( numberOfAgents * ( 1 - agentOccupancy ) ) :
    0;

    var eExponent = averageCallDuration > 0 ?
    ( numberOfAgents - trafficIntensity ) * -1 *
    ( targetAnswerTime / averageCallDuration ) :
    0;
    serviceLevel = 1 - ( probabilityOfWaiting * Math.exp( eExponent ) );

    erlangc.log( 'probabilityOfWaiting: ' + probabilityOfWaiting );
    erlangc.log( 'averageCallDuration: ' + averageCallDuration );
    erlangc.log( 'numberOfAgents: ' + numberOfAgents );
    erlangc.log( 'agentOccupancy: ' + agentOccupancy );
    erlangc.log( 'p: ' + ( 1 - agentOccupancy ) );
    erlangc.log( 'trafficIntensity: ' + trafficIntensity );
    erlangc.log( 'averageSpeedOfAnswer: ' + averageSpeedOfAnswer );
    erlangc.log( 'targetAnswerTime: ' + targetAnswerTime );
    erlangc.log( 'e exponent: ' + eExponent );

  }

  /**
  * Calculates the sigma notation in the denominator of the Erlang-C
  * formula where k is each integer from 0 to number of agents - 1.
  * Sigma means to add the sums of the fraction for each value of k.
  * @return float
  */
  function erlangSigma()
  {
      var output = 0;

      for ( var k = 0; k < numberOfAgents; k++ ) {
          output += ( Math.pow( trafficIntensity, k ) / erlangc.factorial( k ) );
      }
      return output;
  }

  /**
  * Reads a textbox and converts its value into an int.
  */
  function getValueAsFloat( id ) {
      var element = document.getElementById( id );
      var value = element !== null ? element.value.trim().replace( / /g, '' ) : null;
      var int = parseFloat( value );
      return !isNaN( int ) ? int : 0;
  }

  /**
  * Reads the textboxes to collect the user-specified values.
  */
  function read() {

    totalNumberOfCalls = getValueAsFloat( 'totalNumberOfCalls' );
    timePeriodInSeconds = getValueAsFloat( 'timePeriodInSeconds' );
    averageCallDuration = getValueAsFloat( 'averageCallDuration' );
    numberOfAgents = getValueAsFloat( 'numberOfAgents' );
    targetAnswerTime = getValueAsFloat( 'targetAnswerTime' );

  }

  /**
  * Writes the calculated values to the appropriate textboxes.
  */
  function write() {
    var timeUnit = 'second';
    var timeSelect = document.getElementById( 'time-unit' ).value;
    if ( timeSelect === '0' ) {
      timeUnit = 'minute';
    }
    if ( timeSelect === '1' ) {
      timeUnit = 'hour';
    }

    document.getElementById( 'averageArrivalRate' ).value =
    averageArrivalRate + ' calls / ' + timeUnit;
    document.getElementById( 'trafficIntensity' ).value = trafficIntensity;
    document.getElementById( 'agentOccupancy' ).value =
    ( agentOccupancy * 100 ).toFixed( 2 ) + '%';
    document.getElementById( 'probabilityOfWaiting' ).value =
    ( probabilityOfWaiting * 100 ).toFixed( 2 ) + '%';
    document.getElementById( 'averageSpeedOfAnswer' ).value =
    averageSpeedOfAnswer.toFixed( 2 ) + ' ' + timeUnit + 's';
    document.getElementById( 'serviceLevel' ).value = ( serviceLevel * 100 ).toFixed( 2 ) + '%';
  }

  /**
  * Recursive function for calculating the factorial of a given number.
  * @param int number A number.
  * @return int
  */
  erlangc.factorial = function( number ) {

    if ( number === 0 ) { return 1; }
    return number * erlangc.factorial( number - 1 );

  };

  /**
  Slightly more concise and improved version based on
  http://www.jquery4u.com/snippets/url-parameters-jquery/
  from https://gist.github.com/1771618
  apparently, 'unescape' is now deprecated for security reasons.
  it will be used as a fall back instead of the primary way to get an answer.
  window.location.search gets you the query string of the current URL
  */
  function getUrlVar( key ) {

    var queryString = getQueryString();

    if ( key === null ||
      key.trim().replace( / /g, '' ) === '' ||
      queryString === null ||
      queryString.trim().replace( / /g, '' ) === ''
    ) {
      return '';
    }

  var result = new RegExp( key + '=([^&]*)', 'i' ).exec( queryString );
  return result && decodeURIComponent( result[ 1 ] ) || '';
  }

  function getQueryString() {

    return window && window.location && window.location.search ?
    window.location.search :
    '';
  }

  /**
  * Checks for console.log support then logs the specified text.
  */
  erlangc.log = function( text, error ) {

    if ( window.console ) {
        if ( error && window.console.error ) {
          window.console.error( text );
        } else if ( window.console.log ) { window.console.log( text ); }
    } else if ( document.console ) {
        if ( error && document.console.error ) {
          document.console.error( text );
        } else if ( document.console.log ) {
          document.console.log( text );
        }
    }

  };

  /**
  * Single function for reading the user's input and updating the calculations.
  */
  erlangc.update = function() {
    read();
    calculate();
    write();
  };

  // Executes calculations when changing the text in any field.
  $( '.input' ).on( 'change keyup paste', function( e ) {
      erlangc.update();
  } );

  $( '#time-unit' ).change( function( e ) {
      var timeUnit = 's';
      if ( this.value === '0' ) {
          timeUnit = 'm';
      }
      if ( this.value === '1' ) {
          timeUnit = 'h';
      }

      $( 'label[for="timePeriodInSeconds"]' ).text( 'Time period (' + timeUnit + ')' );
      $( 'label[for="averageCallDuration"]' ).text( 'Average call duration (' + timeUnit + ')' );
      $( 'label[for="targetAnswerTime"]' ).text( 'Target answer time (' + timeUnit + ')' );
      $( 'label[for="averageArrivalRate"]' ).
      text( 'Average arrival rate (calls / ' + timeUnit + ')' );
      $( 'label[for="averageSpeedOfAnswer"]' ).
      text( 'Average speed of answer (response time, ' + timeUnit + ')' );

      // Update the calculated values with the proper time unit
      write();
  } );

  if ( getUrlVar( 'time' ) === 'minute' ) {
    document.getElementById( 'timePeriodInSeconds' ).value = 30;
    document.getElementById( 'averageCallDuration' ).value = 4;
    document.getElementById( 'targetAnswerTime' ).value = 0.25;
    document.getElementById( 'time-unit' ).value = '0';
    $( '#time-unit' ).change();
  }

  if ( getUrlVar( 'time' ) === 'hour' ) {
    document.getElementById( 'timePeriodInSeconds' ).value = ( 30 / 60 );
    document.getElementById( 'averageCallDuration' ).value = ( 4 / 60 );
    document.getElementById( 'targetAnswerTime' ).value = ( 0.25 / 60 );
    document.getElementById( 'time-unit' ).value = '1';
  }

  // Executes calculations upon page load.
  erlangc.update();
  $( '#time-unit' ).change();

}( window.erlangc = window.erlangc || {}, jQuery, window, document ) );

// Down here is the code the defines the parameters used at the top of this self-executing function.
// Undefined is not defined so it is undefined. LOL

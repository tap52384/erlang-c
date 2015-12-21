( function( erlangc, $, window, document, undefined ) {

  // enable strict mode
  'use strict';

  /* private variables */
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

  /* private functions */
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
    Math.pow(trafficIntensity, numberOfAgents) /
    erlangc.factorial( numberOfAgents ) :
    0;
    var powDenominator = powNumerator +
    ( ( 1 - agentOccupancy ) * erlangSigma() );
    probabilityOfWaiting = powNumerator / powDenominator;

    // Average speed of answer (wait time, response time)
    // Tw = (probability of waiting * average call duration) /
    // (number of agents * (1 - agent occupancy))
    averageSpeedOfAnswer = numberOfAgents > 0 && agentOccupancy !== 1 ?
    probabilityOfWaiting * averageCallDuration /
    ( numberOfAgents * ( 1 - agentOccupancy ) ) :
    0;

    var eExponent = averageCallDuration > 0 ?
    -( numberOfAgents - trafficIntensity ) *
    ( targetAnswerTime / averageCallDuration ) :
    0;
    serviceLevel = 1 - (probabilityOfWaiting * Math.exp( eExponent ) );

  };

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
  function getValueAsInt( id ) {
      var element = document.getElementById( id );
      var value = element !== null ? element.value.trim().replace( / /g, '' ) : null;
      var int = parseInt( value, 10 );
      return !isNaN(int) ? int : 0;
  }

  /**
  * Reads the textboxes to collect the user-specified values.
  */
  function read() {

    totalNumberOfCalls = getValueAsInt( 'totalNumberOfCalls');
    timePeriodInSeconds = getValueAsInt('timePeriodInSeconds');
    averageCallDuration = getValueAsInt('averageCallDuration');
    numberOfAgents = getValueAsInt('numberOfAgents');
    targetAnswerTime = getValueAsInt('targetAnswerTime');

  };

  /**
  * Writes the calculated values to the appropriate textboxes.
  */
  function write() {
    document.getElementById( 'averageArrivalRate' ).value = averageArrivalRate + ' calls / second';
    document.getElementById( 'trafficIntensity' ).value = trafficIntensity;
    document.getElementById( 'agentOccupancy' ).value = (agentOccupancy * 100).toFixed(2) + "%";
    document.getElementById( 'probabilityOfWaiting' ).value = (probabilityOfWaiting * 100).toFixed(2) + "%";
    document.getElementById( 'averageSpeedOfAnswer' ).value = averageSpeedOfAnswer.toFixed( 2 ) + ' seconds';
    document.getElementById( 'serviceLevel' ).value = ( serviceLevel * 100).toFixed( 2 ) + '%';
  }

  /**
  * Recursive function for calculating the factorial of a given number.
  * @param int number A number.
  * @return int
  */
  erlangc.factorial = function( number ) {

    if ( number === 0) { return 1; }
    return number * erlangc.factorial(number - 1);

  };

  /**
  * Checks for console.log support then logs the specified text.
  */
  erlangc.log = function( text, error ) {

    if ( window.console ) {
        if ( error && window.console.error ) { window.console.error( text ); }
        else if ( window.console.log ) { window.console.log( text ); }
    } else if ( document.console ) {
        if ( error && document.console.error ) { document.console.error( text ); }
        else if ( document.console.log ) { document.console.log( text ); }
    }

  };

  erlangc.update = function() {
    read();
    calculate();
    write();
  };



  $( 'input[type="number"], #timePeriodInSeconds' ).change( function( e ) {
    erlangc.update();
    erlangc.log( 'change should have occurred!' );
  } );

  erlangc.update();
  erlangc.log( 'totalNumberOfCalls: ' + totalNumberOfCalls );



}( window.erlangc = window.erlangc || {}, jQuery, window, document));
// down here is the code the defines the parameters used at the top of this self-executing function.
// undefined is not defined so it is undefined. LOL

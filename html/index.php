<?php

/**
* Used for the demo page to show that the values are expected.
* @param $actual float
* @param $expected float
* @return string
*/
function printAssertion($actual, $expected)
{

    $assertion = abs($actual - $expected) <= 0.02;

    $icon = $assertion === true ?
    'text-success glyphicon-ok' :
    'text-danger glyphicon-remove';

    return '&nbsp;<span class="glyphicon ' . $icon . '" aria-hidden="true"></span>';

}

require 'erlangc.php';

$e = new ErlangC();
$e->calculate();

?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <!-- The above 3 meta tags *must* come first in the head; any other head content must come *after* these tags -->
  <title>Erlang-C Formula</title>

  <!-- Bootstrap -->
  <link href="node_modules/bootstrap/dist/css/bootstrap.min.css" rel="stylesheet">

  <!-- HTML5 shim and Respond.js for IE8 support of HTML5 elements and media queries -->
  <!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
  <!--[if lt IE 9]>
  <script src="https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
  <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
  <![endif]-->

  <link rel="stylesheet"
  href="https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css">

  <!-- Fonts -->
  <link href='//fonts.googleapis.com/css?family=Roboto:400,300' rel='stylesheet' type='text/css'>

  <link href="css/style.css" rel="stylesheet">
</head>
<body>

  <nav class="navbar navbar-inverse navbar-fixed-top">
    <div class="container">
      <div class="navbar-header">
        <button type="button" class="navbar-toggle collapsed"
        data-toggle="collapse" data-target="#navbar" aria-expanded="false"
        aria-controls="navbar">
          <span class="sr-only">Toggle navigation</span>
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
        </button>
        <a class="navbar-brand" href="#">Erlang-C Formula</a>
      </div>
      <div id="navbar" class="collapse navbar-collapse">
        <ul class="nav navbar-nav">
          <li class="active"><a href="#">Home</a></li>
          <li><a href="http://mitan.co.uk/erlang/elgcmath.htm">About</a></li>
        </ul>
      </div><!--/.nav-collapse -->
    </div>
  </nav>

  <div class="container">

    <div class="starter-template">
      <h1>Example calculations<span class="required">*</span></h1>
      <p>Comes from http://mitan.co.uk/erlang/elgcmath.htm</p>
      <hr />

      <label>Given Values</label><br />
      <code>
        Total number of calls: <?php echo $e->totalNumberOfCalls; ?><br />
        Total call duration: <?php echo $e->totalTimeDuration; ?><br />
        Average Call Duration: <?php echo $e->averageCallDuration; ?><br />
        Number of Agents: <?php echo $e->numberOfAgents; ?><br />
        Target Answer Time: <?php echo $e->targetAnswerTime(); ?><br />
      </code>
      <br />
      <label>Calculated Values</label><br />
      <code>
(1) Average Arrival Rate: <?php echo $e->averageArrivalRate();
        echo printAssertion($e->averageArrivalRate(), 0.2); ?><br />
        (4) Traffic Intensity: <?php echo $e->volumeOfCalls() .
        printAssertion($e->volumeOfCalls(), 48); ?><br />
        (5) Agent Occupancy: <?php echo $e->agentOccupancy() .
        printAssertion($e->agentOccupancy(), 0.873); ?><br />
        (6) Probability of Waiting: <?php echo $e->probabilityOfWaiting() .
        printAssertion($e->probabilityOfWaiting(), 0.239); ?><br />
        (8) Average Speed of Answer: <?php echo $e->averageSpeedOfAnswer() .
        printAssertion($e->averageSpeedOfAnswer(), 8.2); ?><br />
        (9) Service Level: <?php echo $e->serviceLevel(15) .
        printAssertion($e->serviceLevel(15), 0.846); ?><br />
      </code>
      <br />
      <p><span class="required">*</span>All time units are measured in seconds.</p>

    </div>

  </div><!-- /.container -->

  <script src="https://gist.github.com/tap52384/5310572f1a053cccc040.js"></script>

  <!-- jQuery (necessary for Bootstrap's JavaScript plugins) -->
  <script src="node_modules/jquery/dist/jquery.min.js"></script>
  <!-- Include all compiled plugins (below), or include individual files as needed -->
  <script src="node_modules/bootstrap/dist/js/bootstrap.min.js"></script>
</body>
</html>

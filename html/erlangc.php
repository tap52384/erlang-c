<?php

/**
* Time unit defaults to seconds to follow the example shown here:
* http://mitan.co.uk/erlang/elgcmath.htm
* exp calculates e to some specified exponent:
* https://secure.php.net/manual/en/function.exp.php
* factorial function for php:
* http://www.hackingwithphp.com/4/18/0/recursive-functions
* Basically, all calculated values are private.
*/
class ErlangC
{

    // There were 360 calls in a half hour.
    public $totalNumberOfCalls = 360;

    // The total time duration in seconds.
    // 1800 seconds = 30 minutes.
    public $totalTimeDuration = 1800;

    // In this example, 360 calls / half hour =
    // 0.2 calls / second
    private $averageArrivalRate = 0;

    // Average call duration in seconds
    public $averageCallDuration = 240;

    // 55 agents
    public $numberOfAgents = 55;

    // Traffic intensity = volume of calls
    // volume of calls = average arrival rate * average call duration
    private $volumeOfCalls = 0;

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
    private $agentOccupancy = 0;

    // Ec(m,u) = probability that a call is not answered immediately and has to
    // wait. This will be a decimal between 0 and 1.
    // Numerator in this formula is:
    // (traffic intensity ^ number of agents / number of agents factorial)
    // Sigma notation means for every number k from 0 to (number of agents - 1),
    // add (traffic intensity ^ k) / (k factorial)
    private $probabilityOfWaiting = 0;

    // Average speed of answer (wait time, response time)
    // Tw = (probability of waiting * average call duration) /
    // (number of agents * (1 - agent occupancy))
    private $averageSpeedOfAnswer = 0;

    private $serviceLevel = 0;

    // Needed for calculating service level.
    // Target speed of answer in seconds.
    private $targetAnswerTime = 15;

    /**
    * Specifying an array of calls where each element value is the duration
    * of the call in minutes, calculates the average call duration.
    * @param array $calls array of integers.
    * @return void
    */
    public function specifyCallDurationInMinutes(array $calls)
    {

        $this->totalNumberOfCalls = count($calls);
        $timeInMinutes = array_sum($calls);

        if ($this->totalNumberOfCalls === 0 || $timeInMinutes === 0) {
            $this->averageCallDuration = 0;
        }

        // change minutes to seconds
        $this->totalTimeDuration = $timeInMinutes * 60;

        // calculate the average call duration in seconds by dividing
        // the total call durationg by the number of calls
        $this->averageCallDuration = ($this->totalTimeDuration / $this->totalNumberOfCalls );

    }

    /**
    * Uses recursion to calculate the factorial of a given integer.
    * @param int $number A number.
    * @return int
    */
    private function factorial($number = 0)
    {
        if ($number === 0) {
            return 1;
        }
        return $number * self::factorial($number - 1);
    }

    /**
    * Calculates the sigma notation in the denominator of the Erlang-C
    * formula where k is each integer from 0 to number of agents - 1.
    * Sigma means to add the sums of the fraction for each value of k.
    * @return float
    */
    private function erlangSigma()
    {
        $output = 0;

        for ($k = 0; $k < $this->numberOfAgents; $k++) {
            $output += (pow($this->volumeOfCalls, $k) / self::factorial($k));
        }
        return $output;
    }

    public function calculate()
    {
        // 1. Average arrival rate
        $this->averageArrivalRate = $this->totalTimeDuration > 0 ?
        ($this->totalNumberOfCalls / $this->totalTimeDuration) :
        0;

        // 4. Traffic intensity (volume of calls)
        $this->volumeOfCalls = $this->averageArrivalRate * $this->averageCallDuration;

        // 5. Agent occupancy (utlitization)
        $this->agentOccupancy = $this->numberOfAgents > 0 ?
        ($this->volumeOfCalls / $this->numberOfAgents) :
        0;

        // 7. Probability of waiting
        $numerator = pow($this->volumeOfCalls, $this->numberOfAgents) /
        self::factorial($this->numberOfAgents);

        $denominator =
        $numerator + ((1 - $this->agentOccupancy) * self::erlangSigma());

        $this->probabilityOfWaiting = $this->numberOfAgents > 0 ?
        ($numerator / $denominator) :
        0;

        // 8. Average speed of answer (response time)
        $this->averageSpeedOfAnswer =
        $this->numberOfAgents > 0 && $this->agentOccupancy !== 1 ?
        ($this->probabilityOfWaiting * $this->averageCallDuration ) /
        ($this->numberOfAgents * (1 - $this->agentOccupancy)) :
        0;

        // 9. Service level
        // Calculate the exponent of e first:
        $exponent = $this->averageCallDuration > 0 ?
        -($this->numberOfAgents - $this->volumeOfCalls) *
        ($this->targetAnswerTime / $this->averageCallDuration) :
        0;
        $this->serviceLevel = 1 - ($this->probabilityOfWaiting) * exp($exponent);

    }

    public function probabilityOfWaiting()
    {
        self::calculate();
        return $this->probabilityOfWaiting;
    }

    public function averageSpeedOfAnswer()
    {
        self::calculate();
        return $this->averageSpeedOfAnswer;
    }

    public function waitTime()
    {
        return self::getAverageSpeedOfAnswer();
    }

    public function serviceLevel($targetAnswerTime = 0)
    {
        $this->targetAnswerTime = $targetAnswerTime;
        self::calculate();
        return $this->serviceLevel;
    }

    public function averageArrivalRate()
    {
        self::calculate();
        return $this->averageArrivalRate;
    }

    public function volumeOfCalls()
    {
        self::calculate();
        return $this->volumeOfCalls;
    }

    public function trafficIntensity()
    {
        return self::volumeOfCalls();
    }

    public function agentOccupancy()
    {
        self::calculate();
        return $this->agentOccupancy;
    }

    public function targetAnswerTime()
    {
        self::calculate();
        return $this->targetAnswerTime;
    }
}

---
author: "Matt Rossman"
date: 2017-07-03
title: Day 20
description: Team meeting with guest Viraj
weight: 10
---

> **Note**: Today I uploaded my main Python module [here](github.com/mattrossman/andover-energy-analysis) for others to reference

## Meeting
Today I had a meeting with Frank, Ajay, and Anil's son Viraj. Viraj is experienced both with statistics and the programming tools we are using so he was able to offer some useful insights. I'll go over some of the main points:

#### Expected Distributions
On [Day 18]({{< ref "day-18.md" >}}) I ran a script to calculate the best fitting distribution of our data, but theoretically this isn't a good model to "expect" of our data since it just happened to be the distribution of our sample. We would have to define ahead of time what distribtion the sample actually should follow. The normal distribution poses the issue of negative values, however a log-normal distribution is a reasonable assumption because it takes that zero limit into account.

#### Marking abnormal values
So far I've been basing by work around normal distributions (which due to the lower bound is not a good choice) and determining outliers in terms of (estimated) standard deviations from the (estimated) mean (really the median). A more generalized way to approach this is to just mark outliers using percentiles.

That's essentially what I was doing with my normal estimations (the points past 2.5 SD would be past approximately the 99th percentile) but since I'm no longer assuming normality this is a better general approach. SciPy distributions have a `.ppf` (percent point function) that perform an inverse of the CDF function allowing us to specify a desired quantile.

#### Quantifying savings
Given a sample and an expected distribution, it would be helpful to compare the actual sample values to the equivalent ideally-distributed set. I have the means to compare samples, but I would need a way to mold an unoptimized sample set into an optimal expected distribution.

Viraj suggested using the quantile values as markers to perform the translation between the sample's empirical distribution and the expected continuous one. This would be a fairer quantification of energy savings than the method I described on [Day 17]({{< ref "day-17.md" >}}) since it would maintain the desired distribution rather than arbitrarily lowering the sample values until they fit in a desired region.

#### More advanced techniques
Viraj brought up the complex method of Poisson regression as an area to look into. Given arguments to a number of paramters (e.g. time of day, day of week, temperature) it would provide an expected distribution of values that are described by those arguments. Based on that distribution, we can filter the sample data by those same parameters and flag the high outliers.

#### Measuring fits of distributions
Lastly, Viraj explained how the `.fit()` function in SciPy calculates the [Maximum Likelihood Estimation](https://en.wikipedia.org/wiki/Maximum_likelihood_estimation) to find the optimal parameters to fit a distribution to sample data. When analyzing the fit, we can calculate this likelihood estimation by calculating $$ \prod\_{i=1}^{n} f(x\_i | \theta)$$ where $\theta$ is a vector of the parameters for the distribution and $x\_i$ is the $i^{\text{th}}$ value from the $n$ sample data points. I'll have to look into a way to present this value in a meaninful way to the user. Another value that could be of use the the [residual sum of squares](https://en.wikipedia.org/wiki/Residual_sum_of_squares).

## Going forward
I'm going to probably slow down a bit now that there are other team members to work with. I want to bring the others up to speed before I get started on some of these complex implementations. Later this week I hope to spend more time with the team to ensure they understand how to use the tools at our disposal. After documenting the contents of our meeting, I'll spend the rest of the day reading up on the SciPy fitting method implementations.

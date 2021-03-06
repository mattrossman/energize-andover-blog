---
author: "Matt Rossman"
date: 2017-06-23
title: Day 14 - Summary
description: Overview of my first couple of weeks, and a guide on how to make a blog
weight: 10
featured: true
---


## Blog Guide

A good chunk of today was spent [writing a guide on how to host your own blog]({{< ref "how-to.md" >}}) just like the one you're reading. Feel free to comment on it if there's areas that need clarification. There's also a link to it on the "About" page so you can find the guide later.

Now I'd like to summarize the main ideas of my first couple of weeks of work.

## Intro
I've been using the Anaconda distribution of Python and Spyder IDE to experiment with parsed power data from the [existing Metasys application](https://www.energizeapps.com/). To get my sample data I clicked "Plot", submitted the sample "2017 Mar - 2016 Aug - Electric - Detail - 24 Hrs" file, and downloaded the results.

#### Anaconda
Python scripts can gain functionality by importing packages. Anaconda makes it easy to install a collection of math and science based packages. You can do so with

	conda install package-name

It will automatically take care of all of the dependencies (some packages require others to be installed first).

#### Pandas
The primary library I have used is Pandas. It lets you easily manage and perform calculations on large datasets. Get it with `conda install pandas`.

#### Spyder IDE
Anaconda comes with a couple of IDEs. For no particular reason I decided to use the Spyder IDE. You can launch it by simple typing `spyder` in the command line.

## Time Filtering
The first main function I worked on was a robust time filter. It lets you select data points from a given date range (or list of such ranges), then filter it down further by factors like day of the week (Mon, Tue, etc.), month of the year (Jan, Feb, etc.). You can specify a specific range of times to include (ex. just between 05:00 and 12:00) or list of such ranges. Lastly, you can specify a blacklist of date ranges to be exluded, which overrides other filter parameters.

This makes it easier to look at a very specific subset of the data in just one step.

Details in [Day 6's]({{< ref "day-6.md" >}}) and [Day 7's]({{< ref "day-7.md" >}}) posts.

## iCal Parsing
To augment the time filter, I made functionality for generating date ranges from `.ics` files. These date ranges can be passed to the time filter function either as the range to include or as the blacklist range.

`.ics` files are the most popular online calendar format. You can export them from Google Calendar or your calendar software of choice.

This makes it easier for a user to create date ranges for the time filter function. For instance, I loaded the Andover Public Schools academic calendar into Google Calendar and exported the `.ics` file to easily filter out days when there was no school.

For more details, read [Day 7's]({{< ref "day-7.md" >}})

## Temperature Data
One factor that could influence power usage is the outside temperature. Most weather APIs do not provide historical data, but I was able to download a report from the [NOAA website](https://www.ncdc.noaa.gov/cdo-web/datatools/findstation) with air temperature data from the nearby town of Lawrence. Using this data we can look for patterns between temperature and power usage.

More details in [Day 12's]({{< ref "day-12.md" >}})

I would like to find a better weather source in the future since this method requires waiting a day for the report to be delivered via email.

## Anomaly Detection
#### Normal distributions
The core of my techniques for anomaly detection lies in the concept of a [normal distribution](https://en.wikipedia.org/wiki/Normal_distribution). This is the kind of distribution most commonly found in nature and other random scenarios. My assumption is that when properly filtered to restrict the influence of external variables, the power data should follow a normal distribution. My goal is to identify areas where it does not abide by this expected distribution.

#### Descriptive Statistics
You probably are familiar with the term [mean](https://en.wikipedia.org/wiki/Arithmetic_mean). It is the average value of a data set used to describe central tendency. Alongside the mean is the [standard deviation](https://en.wikipedia.org/wiki/Standard_deviation), which describes the amount of variation in the data.

When data is [skewed](https://en.wikipedia.org/wiki/Skewness), it is often better to use the [median](https://en.wikipedia.org/wiki/Median) as an indicator of the center rather than the mean. This is because unsymmetric values like outliers can drastically change the mean, which the median is less affected by these types of values.

There is no direct equivalent of the standard deviation for medians, but you can make a good estimate. You can calculate the [Median Absolute Devitation (MAD)](https://en.wikipedia.org/wiki/Median_absolute_deviation) and apply a scaling factor to "convert" to an estimated population standard deviation. For normal distributions, the scaling factor is `1.4826`.

A normal distribution can be represented by its Probability Density Function, which shows the probability of certain values occuring:

![img](https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Normal_Distribution_PDF.svg/350px-Normal_Distribution_PDF.svg.png)

A general rule of thump is the [68-95-99.7 rule](https://en.wikipedia.org/wiki/68%E2%80%9395%E2%80%9399.7_rule) which states the probability of an occurence within 1, 2, or 3 standard deviations of the mean.

#### Population vs Sample
It's important to distinguish between a *population statistic* and a *sample statistic*. Population statistics refer to the absolute, true value of something. You could get the population mean height of a human by considering every human in existence. That is nearly impossible to do, so instead we use sample statistics, for instance, taking the mean of just 100 random people. It's important to keep in mind that the sample mean is not the same as the population mean. You should practice smart sampling techniques to make sure your sample is a good representative of the population.

It's helpful to remember that the population mean is represented by the Greek symbol $\mu$ (mu) and the population standard deviation by $\sigma$ (sigma).

When you see a hat above a symbol, it means that is an estimator rather than a population values (e.g. $\hat{\sigma}$)

#### Rolling windows
Because there are seasonal changes in the power use, I tried working with rolling samples of the power data. This calculates statistical indicators at subsets of the data which may be more similar than the entire data pool would (e.g. there will be less variation in just July than all of 2016). The result is a series of values that track this dynamic statistic. See the [simple moving average](http://www.investopedia.com/terms/s/sma.asp) in stock market analysis for reference.

In my case, I'm looking at rolling medians and rolling MADs because I am factoring in the possibility for abnormal skew in the sample data. Values that are more than 2.5 rolling estimated standard deviations of the rolling median can be flagged as abnormal.

## Percentage Boundaries
One way Anil suggested we can highlight areas for power savings is looking at what percent of the data is contained at a certain value. Pandas has a built in `quantile` function that can tell you the value at a given percentile of the data. We could inform the user that they are able to use less than $x$ kW of power $x\%$ of the time, which would set a target for them to reduce usage.

## Comparing Probability Distribution Functions
My latest goal has been to compare the probability distribution function (PDF) of the sample with an estimated normal distribution. Whereas the rolling median and MAD helps identify *where* abnormalities are occuring, this could identify to what degree power could be saved.


That about sums it up so far. I encourage you to glance over my daily posts for visuals of some of the statistics that I've gone over.

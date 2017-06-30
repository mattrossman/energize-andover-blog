---
author: "Matt Rossman"
date: 2017-06-30
title: Day 19
description: Approximating energy usage from power data
weight: 10
---

## Power → Energy
To gain a meaningful understanding of the difference between sets of power data, it would be helpful to know how much energy was used. Energy is the resource being consumed, and small changes in power usage can accumulate significant differences in energy consumption. It also enables a smoother conversion into dollars spent or saved.

Energy is represented by the area under the power plot. A very basic approximation of this can be calculated with a Reimann sum, which multiplies the power value at one point by the span of time it represents (either spanning to the right or left). A closer approximation can be made with the [Trapezoidal Rule](https://en.wikipedia.org/wiki/Trapezoidal_rule) which forms trapezoids between values, yielding angled tops rather than just flat bars. [Simpson's rule](https://en.wikipedia.org/wiki/Simpson%27s_rule) goes further and estimates a curve between data points. That works better for smooth functions, but I don't know if power usage is a very smooth process. I'd expect distinct increases or decreases in power usage as appliances are turned on or off, although there are many small electrical processes throughout the school that contribute to overall changes in the main. I think the trapezoidal approach is a safe bet.

#### Trapezoidal approximation with NumPy
`numpy.trapz()` takes in a list of y and x values. I wasn't sure how this would play along with timestamp indexes so I did some tests. The type of timestamp that `pandas.Series.index` returns is of type `datetime64` from the NumPy library. I tried running a very simply calculation between two points an hour apart at a constant power value.

	np.trapz([1,1],[np.datetime64('2017-03-20 12:00:00'),np.datetime64('2017-03-20 13:00:00')])

That returned `numpy.timedelta64(3600,'s')`, which represents a timespan of 3600 seconds or 1 hour. NumPy doesn't know what units I'm using for my y-values, but given that I'm defining them as kilowatts I know that this return object represents 1 kWh of energy. To check that the trapezoid math is working properly, I'll try again but with different power values:

	np.trapz([1,3],[np.datetime64('2017-03-20 12:00:00'),np.datetime64('2017-03-20 13:00:00')])

This should be equivalent to keeping the power constant at 2 kW (the midpoint of 1 and 3). Sure enough it returns `numpy.timedelta64(7200,'s')` or 2 kWh. To save myself a step, I can append `.astype('timedelta64[h]')` to convert my timespan values to units of hours (or kWh in my case), and `astype(int)` after that to just extract the value associated with that time span (since I already know the units).

To make sure that this works with my actual series objects, I'll single out the first two main power entries:

	np.trapz(main[0:2],main[0:2].index).astype('timedelta64[h]')

I did the math out and got 65.06 kWh, which matches the output of `numpy.timedelta64(65,'h')`

Now for a whole day:

	In [38]: np.trapz(main['2017-03-03'],main['2017-03-03'].index).astype('timedelta64[h]')
	Out[38]: numpy.timedelta64(5795,'h')

So during all 24 hours of Mar 3rd 2017 (a school day), I'm seeing 5795 kWh of energy used.

[This report](http://www.need.org/files/curriculum/guides/EnergySurveyStudent.pdf) mentions a commercial rate of \$0.10/kWh (that's probably being conservative). That's over \$570 spent on that day alone.

#### Overestimating the gaps
Some gaps I have no control over (a few posts ago I stated that there were seven inconsistencies I was aware of). But when data is filtered, it systematically adds in gaps. For instance, in the school days filter there are gaps on weekends or past school hours. When calculating the trapezoidal approximation, NumPy doesn't know to skip over those gaps. It sees adjacent data points and calculates the trapedoizal area that they span. In reality, those data points might be spanning overnight (e.g. the last point of one day is followed by the first of the next), meaning NumPy would mistakenly include the energy usage of that time period.

First I tried just reindexing my data at a constant 15 minute interval so that it wouldn't see adjacent points that were temporally far apart. However, that just made the `trapz` function return a null value. The other solution that would take more work is splitting the data up into pieces that are at the proper 15 minute frequency, then sum the trapezoidal approximations of all of them. The first step is figuring out how to break up the data into adjacent sections.

#### Splitting the data into continuous groups
`pandas.Series.groupby()` lets you group a set of data by a function called on each index or by a corresponsing list of group labels. I could make my group labels simpy be numbers counting up from 0. Each time an interval higher than the desired threshold is encountered, the group label value increases.

	"""
	consecutives : Data, Offset --> GroupBy
	organizes data in sections that are not more than the threshold time span apart
	Group labels are just a count starting from 0

	Example use:
	    consecutives(df_energy, '15 min')
	"""

	def consecutives(data, threshold):
	    dates = pd.Series(data.index, data.index)
	    indicators = dates.diff() > pd.Timedelta(threshold)
	    groups = indicators.apply(lambda x: 1 if x else 0).cumsum()
	    return data.groupby(groups)

The core of this code comes from [this post](https://stackoverflow.com/questions/13976491/split-a-series-on-time-gaps-in-pandas), but I relabeled things to make it clearer what's going on and added the ability to specify your desired time interval with a [Pandas offset alias](https://pandas.pydata.org/pandas-docs/stable/timeseries.html#timeseries-offset-aliases).

Now if I call `egz.consecutives(school_main, '15 min').groups.values()` I get a list containing DatetimeIndex lists. So the first element would contain all of the timestamps of the first chunk of consecutive values, then indexes for the second chunk, and so on.

#### Using the GroupBy objects

Let's say I store my resultant groups in a variable `grouped`. To perform the trapezoidal approximation on each group, I must say:

	grouped.aggregate(lambda x: np.trapz(x,x.index).astype('timedelta64[h]').astype(int))

which gives me a list of the trapezoidal approximation as calculated on each group. Now I can just sum that series for the total.

#### Success!
I checked that it is working by running the approximation on the 15-minute grouped data from just March 1st and 2nd of 2017, which summed to **5260 kWh**. When I calculated the individual approximations for each day and added them I got the same exact value.

Compare this to running the approximation on *non-grouped* data, in which case it tries to include the night period in between the days, resulting in **12186 kWh** which is clearly wrong.

## Abstracting it
The last step is wrapping everything up nicely:

	"""
	energy_trapz : Data [opt: Offset ] --> int
	uses a trapezoidal approximation to calculate energy used during the time period
	Optional offset parameter determines how large of a time gap between entries
	    is the threshold for data grouping
	"""

	def trapz(data, offset=None):
	    if offset is None:
		offset = pd.Timedelta.max
	    grouped = consecutives(data,offset)
	    approx_kwh = lambda x: np.trapz(x,x.index).astype('timedelta64[h]').astype(int)
	    return grouped.aggregate(approx_kwh).sum()

I'm reminded in this moment of how much I love Pandas. I initially just wrote the function with a Series in mind, since that was all I had tested on. Just out of curiousity, I tried plugging a DataFrame into it to see if it would break. Like magic, it returns a  labeled series of the individual trapezoidal approximations of each column (e.g. Main, Lighting, etc). Thanks Pandas for (sometimes) making things easy.
